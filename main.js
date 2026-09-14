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
 
  const doctorCards = document.querySelectorAll('#doctorGrid .doctor-card');
  
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

const GROQ_QUERY = `*[_type == "doctor"]{
  name,
  specialization,
  consultationDays,
  clinicHours,
  "photoUrl": photo.asset->url
}`;

async function loadDoctors() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(GROQ_QUERY)}`;
  const response = await fetch(url);
  const data = await response.json();
  renderDoctors(data.result);
}

function getInitials(name) {
  return name
    .replace(/^Dr\.?\s*/i, '')       // strip a leading "Dr." if present
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function renderDoctors(doctors) {
  const grid = document.getElementById('doctorGrid');
  if (!grid) return;
  grid.innerHTML = '';

  doctors.forEach(doc => {
    const days = (doc.consultationDays || []).join(', ') || 'TBA';
    const hours = doc.clinicHours || 'TBA';
    const searchText = `${doc.name} ${doc.specialization}`.toLowerCase();

    const avatarHTML = doc.photoUrl
      ? `<img src="${doc.photoUrl}" alt="${doc.name}" class="doctor-avatar-img">`
      : `<div class="doctor-avatar">${getInitials(doc.name)}</div>`;

    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.dataset.search = searchText;
    card.innerHTML = `
      ${avatarHTML}
      <div>
        <h3>${doc.name}</h3>
        <div class="doctor-spec">${doc.specialization}</div>
        <div class="doctor-meta">
          <span><strong>Consultation Days:</strong> ${days}</span>
          <span><strong>Clinic Hours:</strong> ${hours}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

const GROQ_ANNOUNCEMENTS_QUERY = `*[_type == "announcement"] | order(_createdAt desc){
  title,
  tag,
  body,
  date
}`;

async function loadAnnouncements() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(GROQ_ANNOUNCEMENTS_QUERY)}`;
  const response = await fetch(url);
  const data = await response.json();
  renderAnnouncements(data.result);
}

function renderAnnouncements(announcements) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  announcements.forEach(item => {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.innerHTML = `
      <span class="news-tag">${item.tag || ''}</span>
      <h3>${item.title}</h3>
      <p>${item.body || ''}</p>
      <div class="news-date">${item.date || ''}</div>
    `;
    grid.appendChild(card);
  });
}


loadDoctors();
loadAnnouncements();
loadDoctors();


