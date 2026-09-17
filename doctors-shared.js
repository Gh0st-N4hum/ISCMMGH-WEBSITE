// =========================================================
// SHARED DOCTOR DATA + PROFILE MODAL
// Loaded by both index.html (specialization map) and
// doctors.html (full directory). Must load BEFORE main.js
// and doctors.js.
// =========================================================

const SANITY_PROJECT_ID = 'bw8292do';
const SANITY_DATASET = 'production';

const GROQ_DOCTORS_QUERY = `*[_type == "doctor"] | order(name asc){
  name, specialization, consultationDays, clinicHours, background,
  "photoUrl": photo.asset->url
}`;

// Canonical specialization order. Matches the list in the Sanity
// doctor schema — add a specialization there and here together.
const SPECS = [
  ['Cardiology', 'ic-cardiology'],
  ['Pulmonology', 'ic-pulmonology'],
  ['Pediatrics', 'ic-pediatrics'],
  ['General Surgery', 'ic-surgery'],
  ['Internal Medicine', 'ic-internal'],
  ['OB-GYN', 'ic-obgyn'],
  ['General Medicine', 'ic-general'],
  ['Orthopedics', 'ic-orthopedics'],
  ['Dermatology', 'ic-dermatology'],
  ['ENT (Otorhinolaryngology)', 'ic-ent'],
  ['Other', 'ic-other']
].map(([label, icon]) => ({ label, icon, short: label.replace(/\s*\(.*\)/, '') }));

const ICON_BY_SPEC = Object.fromEntries(SPECS.map(s => [s.label, s.icon]));
const SHORT_BY_SPEC = Object.fromEntries(SPECS.map(s => [s.label, s.short]));

const DOCTORS_PAGE = 'doctors.html';

function getInitials(name) {
  if (!name) return '';
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

function iconChip(iconId, className) {
  const span = document.createElement('span');
  span.className = className || 'chip';
  span.innerHTML = `<svg viewBox="0 0 24 24"><use href="#${iconId}"></use></svg>`;
  return span;
}

async function fetchDoctors() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(GROQ_DOCTORS_QUERY)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.result || [];
}

// Builds a doctor avatar as a real element. Photo when available,
// initials otherwise. Never uses innerHTML with CMS text.
function buildAvatar(doc, imgClass, fallbackClass) {
  if (doc.photoUrl) {
    const img = document.createElement('img');
    img.src = doc.photoUrl;
    img.alt = doc.name || '';
    img.loading = 'lazy';
    img.className = imgClass;
    return img;
  }
  const div = document.createElement('div');
  div.className = fallbackClass;
  div.textContent = getInitials(doc.name);
  return div;
}

// ---------- shared profile modal ----------

function openDoctorModal(doc) {
  const modal = document.getElementById('doctorModal');
  const body = document.getElementById('doctorModalBody');
  if (!modal || !body || !doc) return;

  const days = (doc.consultationDays || []).join(', ') || 'TBA';
  const hours = doc.clinicHours || 'TBA';

  body.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'doctor-modal-header';
  header.appendChild(buildAvatar(doc, 'doctor-modal-avatar-img', 'doctor-modal-avatar'));

  const nameWrap = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.style.marginBottom = '4px';
  h2.textContent = doc.name;
  const spec = document.createElement('div');
  spec.className = 'doctor-spec';
  spec.textContent = doc.specialization || '';
  nameWrap.append(h2, spec);
  header.appendChild(nameWrap);
  body.appendChild(header);

  const meta = document.createElement('div');
  meta.className = 'doctor-meta';
  meta.style.marginBottom = '18px';
  meta.innerHTML = `<span><strong>Consultation Days:</strong> </span><span><strong>Clinic Hours:</strong> </span>`;
  meta.children[0].append(days);
  meta.children[1].append(hours);
  body.appendChild(meta);

  const bioWrap = document.createElement('div');
  bioWrap.className = 'announcement-modal-body';
  const bio = document.createElement('p');
  if (!doc.background) bio.style.color = 'var(--ink-soft)';
  bio.textContent = doc.background || 'No additional background provided.';
  bioWrap.appendChild(bio);
  body.appendChild(bioWrap);

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDoctorModal() {
  const modal = document.getElementById('doctorModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('doctorModalClose')?.addEventListener('click', closeDoctorModal);
document.getElementById('doctorModalBackdrop')?.addEventListener('click', closeDoctorModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDoctorModal();
});
