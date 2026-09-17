// =========================================================
// DOCTOR DIRECTORY PAGE (doctors.html)
// Scales to any number of doctors: sidebar of specializations,
// searchable, scrollable card grid. Each card shows the profile
// up front — photo, schedule, and background — so you don't have
// to click through to learn anything useful.
//
// Wrapped in an IIFE so its names never collide with main.js.
// =========================================================

(function () {
  const ALL = 'All';
  const BIO_EXCERPT = 150;

  let doctors = [];
  let activeSpec = ALL;
  let query = '';

  const elSidebar = document.getElementById('specSidebar');
  const elResults = document.getElementById('directoryResults');
  const elSearch = document.getElementById('directorySearch');
  const elCount = document.getElementById('directoryCount');
  if (!elResults) return;

  // ---------- helpers ----------

  function countFor(label) {
    return label === ALL
      ? doctors.length
      : doctors.filter(d => d.specialization === label).length;
  }

  function matchesQuery(doc) {
    if (!query) return true;
    const hay = `${doc.name || ''} ${doc.specialization || ''} ${doc.background || ''}`.toLowerCase();
    return hay.includes(query);
  }

  function visibleDoctors() {
    return doctors.filter(d =>
      (activeSpec === ALL || d.specialization === activeSpec) && matchesQuery(d)
    );
  }

  function truncate(text, length) {
    if (!text) return '';
    return text.length <= length ? text : text.slice(0, length).trim() + '…';
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    if (activeSpec === ALL) url.searchParams.delete('spec');
    else url.searchParams.set('spec', activeSpec);
    history.replaceState(null, '', url);
  }

  // ---------- sidebar ----------

  function renderSidebar() {
    elSidebar.innerHTML = '';

    const entries = [{ label: ALL, icon: 'ic-doctor-hub', short: 'All doctors' }]
      .concat(SPECS.filter(s => countFor(s.label) > 0));

    entries.forEach(entry => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'spec-filter' + (entry.label === activeSpec ? ' active' : '');
      btn.appendChild(iconChip(entry.icon, 'spec-filter-icon'));

      const name = document.createElement('span');
      name.className = 'spec-filter-name';
      name.textContent = entry.short;

      const count = document.createElement('span');
      count.className = 'spec-filter-count';
      count.textContent = countFor(entry.label);

      btn.append(name, count);
      btn.addEventListener('click', () => {
        activeSpec = entry.label;
        syncUrl();
        renderSidebar();
        renderResults();
        elResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      elSidebar.appendChild(btn);
    });
  }

  // ---------- doctor card ----------

  function buildCard(doc) {
    const card = document.createElement('article');
    card.className = 'doc-card';

    const top = document.createElement('div');
    top.className = 'doc-card-top';
    top.appendChild(buildAvatar(doc, 'doc-card-photo', 'doc-card-initials'));

    const idWrap = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = doc.name;
    const spec = document.createElement('div');
    spec.className = 'doctor-spec';
    spec.textContent = doc.specialization || '';
    idWrap.append(h3, spec);
    top.appendChild(idWrap);
    card.appendChild(top);

    const meta = document.createElement('div');
    meta.className = 'doctor-meta';
    meta.innerHTML = `<span><strong>Consultation Days:</strong> </span><span><strong>Clinic Hours:</strong> </span>`;
    meta.children[0].append((doc.consultationDays || []).join(', ') || 'TBA');
    meta.children[1].append(doc.clinicHours || 'TBA');
    card.appendChild(meta);

    if (doc.background) {
      const bio = document.createElement('p');
      bio.className = 'doc-card-bio';
      bio.textContent = truncate(doc.background, BIO_EXCERPT);
      card.appendChild(bio);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'doc-card-link';
    btn.textContent = 'View full profile';
    btn.addEventListener('click', () => openDoctorModal(doc));
    card.appendChild(btn);

    return card;
  }

  // ---------- results ----------

  function renderResults() {
    const list = visibleDoctors();
    elResults.innerHTML = '';

    elCount.textContent = list.length === doctors.length
      ? `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`
      : `${list.length} of ${doctors.length} doctors`;

    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'directory-empty';
      empty.textContent = query
        ? 'No doctors match that search. Try a name or a specialization.'
        : activeSpec === ALL
          ? 'No doctors have been listed yet. Please check back soon.'
          : 'No doctors listed under this specialization yet.';
      elResults.appendChild(empty);
      return;
    }

    // Grouped headings only make sense when more than one
    // specialization is on screen.
    if (activeSpec === ALL) {
      SPECS.forEach(s => {
        const group = list.filter(d => d.specialization === s.label);
        if (!group.length) return;
        elResults.appendChild(buildGroup(s.label, group));
      });
      const unknown = list.filter(d => !ICON_BY_SPEC[d.specialization]);
      if (unknown.length) elResults.appendChild(buildGroup('Other', unknown));
    } else {
      elResults.appendChild(buildGroup(activeSpec, list));
    }
  }

  function buildGroup(label, group) {
    const section = document.createElement('section');
    section.className = 'doc-group';

    const head = document.createElement('div');
    head.className = 'doc-group-head';
    head.appendChild(iconChip(ICON_BY_SPEC[label] || 'ic-other', 'doc-group-icon'));
    const h2 = document.createElement('h2');
    h2.textContent = label;
    const n = document.createElement('span');
    n.className = 'doc-group-count';
    n.textContent = `${group.length} doctor${group.length === 1 ? '' : 's'}`;
    head.append(h2, n);
    section.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'doc-grid';
    group.forEach(doc => grid.appendChild(buildCard(doc)));
    section.appendChild(grid);

    return section;
  }

  // ---------- boot ----------

  elSearch?.addEventListener('input', function () {
    query = this.value.trim().toLowerCase();
    renderResults();
  });

  (async function boot() {
    const requested = new URL(window.location.href).searchParams.get('spec');
    if (requested && SPECS.some(s => s.label === requested)) activeSpec = requested;

    try {
      doctors = await fetchDoctors();
    } catch (e) {
      elResults.innerHTML = '';
      const err = document.createElement('p');
      err.className = 'directory-empty';
      err.textContent = 'The doctor list could not be loaded right now. Please refresh, or call the hotline for assistance.';
      elResults.appendChild(err);
      return;
    }

    // A deep link to a specialization with nobody in it would show an
    // empty page for no reason, so fall back to the full list.
    if (activeSpec !== ALL && countFor(activeSpec) === 0) {
      activeSpec = ALL;
      syncUrl();
    }

    renderSidebar();
    renderResults();
  })();
})();
