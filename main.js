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


  // =========================================================
  // 3. DOCTOR DIRECTORY SEARCH FILTER
  // =========================================================
  // Originally included in index.html to filter doctor cards
 
  
const searchInput = document.getElementById('doctorSearch');

if (searchInput) {
  searchInput.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    // Look up cards fresh every time you type, instead of once at page
    // load — since Sanity's real data replaces the placeholder cards
    // a moment after the page loads.
    document.querySelectorAll('#doctorGrid .doctor-card').forEach(function(card) {
      const match = card.dataset.search.toLowerCase().includes(q);
      card.style.display = match ? '' : 'none';
    });
  });
}

});

const SANITY_PROJECT_ID = 'bw8292do';
const SANITY_DATASET = 'production';

let allDoctors = [];
let activeCategory = 'All';

const GROQ_DOCTORS_QUERY = `*[_type == "doctor"]{
  name, specialization, consultationDays, clinicHours, background,
  "photoUrl": photo.asset->url
}`;

async function loadDoctors() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(GROQ_DOCTORS_QUERY)}`;
  const response = await fetch(url);
  const data = await response.json();
  allDoctors = data.result;
  renderCategoryPills(allDoctors);
  applyDoctorFilters();
}

function renderCategoryPills(doctors) {
  const container = document.getElementById('categoryPills');
  if (!container) return;
  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))].sort();
  const categories = ['All', ...specializations];

  container.innerHTML = categories.map(cat =>
    `<button type="button" class="category-pill${cat === activeCategory ? ' active' : ''}" data-category="${cat}">${cat}</button>`
  ).join('');

  container.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.dataset.category;
      container.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyDoctorFilters();
    });
  });
}

function applyDoctorFilters() {
  const searchInput = document.getElementById('doctorSearch');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = allDoctors.filter(doc => {
    const matchesCategory = activeCategory === 'All' || doc.specialization === activeCategory;
    const matchesSearch = `${doc.name} ${doc.specialization}`.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  renderDoctors(filtered);
}

function renderDoctors(doctors) {
  const grid = document.getElementById('doctorGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (doctors.length === 0) {
    grid.innerHTML = '<p style="color:var(--ink-soft);">No doctors found for this selection.</p>';
    return;
  }

  doctors.forEach(doc => {
    const days = (doc.consultationDays || []).join(', ') || 'TBA';
    const hours = doc.clinicHours || 'TBA';
    const avatarHTML = doc.photoUrl
      ? `<img src="${doc.photoUrl}" alt="${doc.name}" class="doctor-avatar-img">`
      : `<div class="doctor-avatar">${getInitials(doc.name)}</div>`;
    const bioHTML = doc.background ? `<p class="doctor-bio">${doc.background}</p>` : '';

    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.innerHTML = `
      ${avatarHTML}
      <div>
        <h3>${doc.name}</h3>
        <div class="doctor-spec">${doc.specialization}</div>
        <div class="doctor-meta">
          <span><strong>Consultation Days:</strong> ${days}</span>
          <span><strong>Clinic Hours:</strong> ${hours}</span>
        </div>
        ${bioHTML}
      </div>
    `;
    grid.appendChild(card);
  });
}

const searchInput = document.getElementById('doctorSearch');
if (searchInput) searchInput.addEventListener('input', applyDoctorFilters);


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

loadDoctors();
loadAnnouncements();


