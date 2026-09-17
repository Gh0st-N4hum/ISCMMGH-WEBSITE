document.addEventListener("DOMContentLoaded", () => {

  // =========================================================
  // 1. SCROLL REVEAL ANIMATIONS (Intersection Observer)
  // =========================================================
  // This selects all elements with the "reveal" class and 
  // adds the "active" class when they scroll into view.
  const reveals = document.querySelectorAll('.reveal');

  const revealOptions = {
    threshold: 0.15, // Triggers when 15% of the element is visible
    rootMargin: "0px 0px -50px 0px" // Triggers slightly before the very bottom of the screen
  };

  const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return; // Do nothing if not on screen
      } else {
        entry.target.classList.add('active');
        // Stop observing once the animation has triggered so it stays visible
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  reveals.forEach(reveal => {
    revealOnScroll.observe(reveal);
  });


  // =========================================================
  // 2. DYNAMIC NAVBAR SHADOW
  // =========================================================
  // Adds a drop-shadow to the sticky header once the user scrolls down
  const header = document.getElementById('site-header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });


});

// Doctor data, SPECS, getInitials, iconChip and the profile modal
// all live in doctors-shared.js, which loads before this file.

// =========================================================
// SPECIALIZATION MAP (homepage)
// Shows the 11 specializations only — never individual doctors,
// so the layout stays fixed no matter how many doctors exist.
// Selecting one hands off to doctors.html.
// =========================================================

let specCounts = {};
let treeExpanded = false;
const specNodes = new Map();
let doctorTree, doctorTreeLinks, hubNode;

function makeTreeNode(tree, cls, iconId, label, hint) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'node ' + cls;
  b.appendChild(iconChip(iconId));
  const lbl = document.createElement('span');
  lbl.className = 'lbl';
  lbl.textContent = label;
  b.appendChild(lbl);
  if (hint) {
    const h = document.createElement('span');
    h.className = 'hint';
    h.textContent = hint;
    b.appendChild(h);
  }
  tree.appendChild(b);
  return b;
}

function placeNode(node, dx, dy, scale) {
  node.style.transform = `translate(-50%,-50%) translate(${dx}px, ${dy}px) scale(${scale ?? 1})`;
}

function treeGeometry() {
  const w = doctorTree.clientWidth, h = doctorTree.clientHeight;
  const mobile = w < 640;
  return {
    w, h, cx: w / 2, cy: h / 2,
    rx: Math.max(120, w / 2 - (mobile ? 66 : 104)),
    ry: h / 2 - (mobile ? 70 : 86)
  };
}

function specOffset(i) {
  const g = treeGeometry();
  const a = -Math.PI / 2 + (i * 2 * Math.PI / SPECS.length);
  return { dx: Math.cos(a) * g.rx, dy: Math.sin(a) * g.ry, a };
}

async function initDoctorTree() {
  doctorTree = document.getElementById('doctorTree');
  doctorTreeLinks = document.getElementById('doctorTreeLinks');
  if (!doctorTree) return;

  hubNode = makeTreeNode(doctorTree, 'hub', 'ic-doctor-hub', 'Our doctors', 'Tap to open');
  requestAnimationFrame(() => { hubNode.classList.add('show'); placeNode(hubNode, 0, 0, 1); });
  hubNode.addEventListener('click', () => treeExpanded ? collapseDoctorTree() : expandDoctorTree());

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!treeExpanded) return;
      SPECS.forEach((s, i) => {
        const n = specNodes.get(s.label); if (!n) return;
        const { dx, dy } = specOffset(i); placeNode(n, dx, dy, 1);
      });
      redrawTreeLinks();
    }, 160);
  });

  // Counts are the only doctor data the homepage needs.
  try {
    const docs = await fetchDoctors();
    specCounts = docs.reduce((acc, d) => {
      if (d.specialization) acc[d.specialization] = (acc[d.specialization] || 0) + 1;
      return acc;
    }, {});
    specNodes.forEach((node, label) => updateSpecNodeLabel(node, label));
  } catch (e) {
    // Counts are a nice-to-have; the map still works without them.
  }
}

function updateSpecNodeLabel(node, label) {
  const n = specCounts[label] || 0;
  node.querySelector('.lbl').textContent = n ? `${SHORT_BY_SPEC[label]} · ${n}` : SHORT_BY_SPEC[label];
  node.classList.toggle('empty', n === 0);
}

function expandDoctorTree() {
  treeExpanded = true;
  hubNode.querySelector('.hint').textContent = 'Tap to close';
  SPECS.forEach((s, i) => {
    let node = specNodes.get(s.label);
    if (!node) {
      node = makeTreeNode(doctorTree, 'spec', s.icon, s.short);
      node.addEventListener('click', e => {
        e.stopPropagation();
        window.location.href = `${DOCTORS_PAGE}?spec=${encodeURIComponent(s.label)}`;
      });
      specNodes.set(s.label, node);
      updateSpecNodeLabel(node, s.label);
      placeNode(node, 0, 0, .3);
    }
    const { dx, dy } = specOffset(i);
    setTimeout(() => { node.classList.add('show'); placeNode(node, dx, dy, 1); }, 40 + i * 45);
  });
  setTimeout(redrawTreeLinks, 460);
}

function collapseDoctorTree() {
  treeExpanded = false;
  hubNode.querySelector('.hint').textContent = 'Tap to open';
  specNodes.forEach(n => { n.classList.remove('show'); placeNode(n, 0, 0, .3); });
  doctorTreeLinks.innerHTML = '';
}

function redrawTreeLinks() {
  doctorTreeLinks.innerHTML = '';
  const g = treeGeometry();
  doctorTreeLinks.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`);
  if (!treeExpanded) return;

  SPECS.forEach((s, i) => {
    const { dx, dy } = specOffset(i);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', g.cx); l.setAttribute('y1', g.cy);
    l.setAttribute('x2', g.cx + dx); l.setAttribute('y2', g.cy + dy);
    doctorTreeLinks.appendChild(l);
  });
}



const GROQ_ANNOUNCEMENTS_QUERY = `*[_type == "announcement"] | order(_createdAt desc){
  title, tag, body, date,
  "imageUrl": image.asset->url
}`;

let allAnnouncements = [];
const ANNOUNCEMENTS_INITIAL_LIMIT = 3;
const ANNOUNCEMENT_EXCERPT_LENGTH = 150;
let announcementsExpanded = false;

async function loadAnnouncements() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(GROQ_ANNOUNCEMENTS_QUERY)}`;
  const response = await fetch(url);
  const data = await response.json();
  allAnnouncements = data.result || [];
  renderAnnouncements();
}

function truncateText(text, length) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '…';
}

function renderAnnouncements() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (allAnnouncements.length === 0) {
    grid.innerHTML = '<p style="color:var(--ink-soft);">No announcements right now — check back soon.</p>';
    return;
  }

  const visible = announcementsExpanded
    ? allAnnouncements
    : allAnnouncements.slice(0, ANNOUNCEMENTS_INITIAL_LIMIT);

  visible.forEach((item, index) => {
    const article = document.createElement('article');
    article.className = 'news-card';

    const imageHTML = item.imageUrl
      ? `<img src="${item.imageUrl}" alt="${item.title || ''}" class="news-card-img">`
      : '';

    const isLong = (item.body || '').length > ANNOUNCEMENT_EXCERPT_LENGTH;
    const excerpt = truncateText(item.body, ANNOUNCEMENT_EXCERPT_LENGTH);
    const viewMoreHTML = isLong
      ? `<button type="button" class="news-excerpt-link" data-announcement-index="${index}">View More</button>`
      : '';

    article.innerHTML = `
      ${imageHTML}
      <span class="news-tag">${item.tag || ''}</span>
      <h3>${item.title || ''}</h3>
      <p>${excerpt}</p>
      ${viewMoreHTML}
      <div class="news-date">${item.date || ''}</div>
    `;
    grid.appendChild(article);
  });

  // Wire up "View More" buttons to open the modal with the right announcement
  grid.querySelectorAll('.news-excerpt-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.announcementIndex);
      openAnnouncementModal(visible[idx]);
    });
  });

  renderViewMoreListButton(grid);
}

function renderViewMoreListButton(grid) {
  const existingBtn = document.getElementById('newsViewMoreWrap');
  if (existingBtn) existingBtn.remove();

  if (allAnnouncements.length <= ANNOUNCEMENTS_INITIAL_LIMIT) return;

  const wrap = document.createElement('div');
  wrap.id = 'newsViewMoreWrap';
  wrap.style.textAlign = 'center';
  wrap.style.gridColumn = '1 / -1';
  wrap.style.marginTop = '20px';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-primary';
  btn.textContent = announcementsExpanded ? 'Show Less' : 'View More Announcements';
  btn.addEventListener('click', () => {
    announcementsExpanded = !announcementsExpanded;
    renderAnnouncements();
  });

  wrap.appendChild(btn);
  grid.parentElement.insertBefore(wrap, grid.nextSibling);
}

// ---------- Modal logic ----------
function openAnnouncementModal(item) {
  const modal = document.getElementById('announcementModal');
  const body = document.getElementById('announcementModalBody');
  if (!modal || !body || !item) return;

  const imageHTML = item.imageUrl
    ? `<img src="${item.imageUrl}" alt="${item.title || ''}" class="announcement-modal-img">`
    : '';

  body.innerHTML = `
    ${imageHTML}
    <span class="news-tag">${item.tag || ''}</span>
    <h2 style="margin-top:10px;">${item.title || ''}</h2>
    <div class="announcement-modal-body">
      <p>${item.body || ''}</p>
    </div>
    <div class="news-date" style="margin-top:16px;">${item.date || ''}</div>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeAnnouncementModal() {
  const modal = document.getElementById('announcementModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('announcementModalClose')?.addEventListener('click', closeAnnouncementModal);
document.getElementById('announcementModalBackdrop')?.addEventListener('click', closeAnnouncementModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAnnouncementModal();
});



initDoctorTree();
if (document.getElementById('newsGrid')) loadAnnouncements();