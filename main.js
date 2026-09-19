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
// TOP SPECIALTIES GRID (homepage)
// Shows the 8 specialties with the most doctors on staff, used
// as a proxy for demand since we don't track search volume.
// Displayed alphabetically once chosen, so the grid stays easy
// to scan rather than reshuffling by count. Every card links to
// the full directory pre-filtered; anything not in the top 8
// (or added later) is still reachable from there.
// =========================================================

const TOP_SPEC_COUNT = 8;

function renderSpecGrid(specsToShow) {
  const grid = document.getElementById('specGrid');
  if (!grid) return;
  grid.innerHTML = '';

  specsToShow.forEach(s => {
    const count = specCounts[s.label] || 0;
    const a = document.createElement('a');
    a.className = 'spec-card';
    a.href = `doctors.html?spec=${encodeURIComponent(s.label)}`;
    a.appendChild(iconChip(s.icon, 'spec-card-icon'));
    const name = document.createElement('span');
    name.className = 'spec-card-name';
    name.textContent = s.short;
    const count_el = document.createElement('span');
    count_el.className = 'spec-card-count';
    count_el.textContent = count ? `${count} Doctor${count === 1 ? '' : 's'}` : 'See specialists';
    a.append(name, count_el);
    grid.appendChild(a);
  });
}

let specCounts = {};

async function initSpecGrid() {
  if (!document.getElementById('specGrid')) return;

  // Render something useful immediately rather than waiting on the
  // network — alphabetical order is a fine default before counts exist.
  const alphabetical = [...SPECS].sort((a, b) => a.short.localeCompare(b.short));
  renderSpecGrid(alphabetical.slice(0, TOP_SPEC_COUNT));

  let docs = [];
  try {
    docs = await fetchDoctors();
  } catch (e) {
    return; // grid already has a sensible default, nothing more to do
  }

  specCounts = docs.reduce((acc, d) => {
    if (d.specialization) acc[d.specialization] = (acc[d.specialization] || 0) + 1;
    return acc;
  }, {});

  const hasAnyCounts = Object.keys(specCounts).length > 0;
  const bySpecCount = [...SPECS].sort((a, b) => {
    const diff = (specCounts[b.label] || 0) - (specCounts[a.label] || 0);
    return diff !== 0 ? diff : a.short.localeCompare(b.short);
  });
  const top = (hasAnyCounts ? bySpecCount : alphabetical)
    .slice(0, TOP_SPEC_COUNT)
    .sort((a, b) => a.short.localeCompare(b.short));

  renderSpecGrid(top);
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



initSpecGrid();
if (document.getElementById('newsGrid')) loadAnnouncements();