// =========================================================
// SERVICES DIRECTORY (services.html)
// Static reference data for lab tests and imaging studies —
// this doesn't change often enough to warrant a CMS query, so
// it's hardcoded here rather than fetched from Sanity.
//
// Two states on the page:
//  - Browse (default, empty search box): two compact cards, one per
//    section, each listing its category names as chips right on the
//    card. Clicking the card — or one specific chip — opens a modal
//    with that section's full searchable accordion.
//  - Results (search box has text): the browse cards hide and a full
//    accordion for BOTH sections renders inline, filtered to the
//    query, auto-expanded on matches. This keeps "search for a test
//    by name" working straight from the page without forcing anyone
//    into a modal first.
//
// Icon choice: icons are assigned per CATEGORY, not per individual
// test — see the note further down at buildTestCard.
// =========================================================

const SERVICE_SECTIONS = [
  {
    id: 'laboratory',
    title: 'Laboratory Services',
    icon: 'ic-lab',
    blurb: 'Blood work, urinalysis, and other specimen-based tests, processed on-site.',
    categories: [
      { name: 'Hematology', icon: 'ic-drop', tests: ['CBC with Platelet Count', 'ABO/Rh Typing (Blood Typing)', 'Bleeding Time / Clotting Time', 'Peripheral Blood Smear (PBS)'] },
      { name: 'Clinical Microscopy', icon: 'ic-microscope', tests: ['Urinalysis', 'Pregnancy Test (Urine)', 'Fecalysis', 'Fecal Occult Blood Test (FOBT)'] },
      { name: 'Blood Bank', icon: 'ic-drop', tests: ['Crossmatching'] },
      { name: 'COVID-19 Testing', icon: 'ic-virus', tests: ['Rapid Antigen Test (RAT)'] },
      { name: 'Serology', icon: 'ic-microscope', tests: ['HBsAg', 'Syphilis Antibody Test', 'HAV-IgM', 'Anti-HCV', 'Typhidot', 'Dengue Duo', 'HIV', 'Pregnancy Test (Serum)'] },
      { name: 'Lipid Profile', icon: 'ic-drop', tests: ['Total Cholesterol', 'Triglycerides', 'HDL', 'LDL'] },
      { name: 'Liver Function Test', icon: 'ic-drop', tests: ['ALT / SGPT', 'AST / SGOT'] },
      { name: 'Bone / Arthritis Test', icon: 'ic-drop', tests: ['Blood Uric Acid (BUA)'] },
      { name: 'Glucose', icon: 'ic-drop', tests: ['Fasting Blood Sugar (FBS)', 'Random Blood Sugar (RBS)', '2-Hour Post-Prandial Blood Sugar', '75g OGTT', 'HbA1c'] },
      { name: 'Serum Electrolytes', icon: 'ic-drop', tests: ['Sodium', 'Potassium', 'Chloride'] },
      { name: 'Special Chemistry', icon: 'ic-drop', tests: ['Troponin I (Quantitative)', 'Prostate-Specific Antigen (PSA)', 'Serum Ferritin'] },
      { name: 'Thyroid Profile', icon: 'ic-drop', tests: ['FT3', 'FT4', 'TSH', 'T3', 'T4'] },
      { name: 'Renal Function Test', icon: 'ic-drop', tests: ['Blood Urea Nitrogen (BUN)', 'Creatinine'] }
    ]
  },
  {
    id: 'imaging',
    title: 'Diagnostic Imaging — X-Ray / Ultrasound / 2D Echo',
    icon: 'ic-scan',
    blurb: 'X-ray, ultrasound, and 2D echo studies, read by our radiology team.',
    categories: [
      { name: 'Chest X-Ray', icon: 'ic-scan', tests: ['Chest X-Ray PA (Adult)', 'Chest X-Ray PAL (Adult)', 'Chest X-Ray APL Pedia (2 Films)', 'Chest Lateral Decubitus', 'Apicolordotic View', 'Abdomen AP', 'Abdomen AP & Upright', 'KUB'] },
      { name: 'Skull X-Ray', icon: 'ic-scan', tests: ['Skull APL', 'Skull Series', "PNS Water's View", 'PNS APL', 'TMJ Open/Close', 'Mastoid Series', 'Orbit APL', 'Zygoma AP Axial', 'Nasal Bone', 'Mandibles'] },
      {
        name: 'Spine & Extremity X-Ray', icon: 'ic-bone',
        subgroups: [
          { name: 'Upper Body & Arms', tests: ['Clavicle', 'Scapula', 'Shoulder', 'Humerus APL', 'Elbow APL', 'Forearm APL', 'Wrist APL', 'Hand APO'] },
          { name: 'Lower Body & Legs', tests: ['Femur APL', 'Knee APL', 'Leg APL', 'Ankle APL', 'Foot APO', 'Hip Joint (Frog-Leg)', 'Sacroiliac Joint APO'] }
        ]
      },
      { name: '2D Echo', icon: 'ic-cardiology', tests: ['2D Echo with Doppler'] },
      { name: 'Ultrasound', icon: 'ic-waves', tests: ['Whole Abdomen', 'KUB', 'KUB w/ Prostate (60 yrs old & above, Male)', 'Lower Abdomen (Renopelvic / Renoprostate)', 'Upper Abdomen', 'LGBP / HBT', 'Scrotal w/ Doppler', 'Fetal Biometry', 'BPS', 'BPS (Twins)', 'Transvaginal (TVS)', 'Pelvic (Transabdominal)', 'Pelvic (Transrectal)', 'Breast, Bilateral', 'Soft Tissue, Plain', 'Soft Tissue w/ Doppler', 'Chest UTZ', 'Chest w/ Markings UTZ', 'Paracentesis / Thoracentesis', 'UTZ-Guided Biopsy', 'Vascular / Arterial, Upper (Bilateral)', 'Venous / Arterial Doppler', 'Thyroid UTZ', 'Fetal Bio w/ TVS Fetal Funneling', 'Cranial UTZ'] }
    ]
  }
];

(function () {
  const elWrap = document.getElementById('serviceSections');
  const elSearch = document.getElementById('servicesSearch');
  const elSummary = document.getElementById('servicesSummary');
  if (!elWrap) return;

  const elModal = document.getElementById('serviceModal');
  const elModalBody = document.getElementById('serviceModalBody');
  const elModalClose = document.getElementById('serviceModalClose');
  const elModalBackdrop = document.getElementById('serviceModalBackdrop');

  function categoryTests(cat) {
    return cat.subgroups ? cat.subgroups.flatMap(g => g.tests) : cat.tests;
  }

  const totalCategories = SERVICE_SECTIONS.reduce((s, sec) => s + sec.categories.length, 0);
  const totalTests = SERVICE_SECTIONS.reduce(
    (sum, sec) => sum + sec.categories.reduce((s, c) => s + categoryTests(c).length, 0), 0
  );

  function iconEl(iconId, className) {
    const span = document.createElement('span');
    span.className = className;
    span.innerHTML = `<svg viewBox="0 0 24 24"><use href="#${iconId}"></use></svg>`;
    return span;
  }

  // ---------- shared: one category → one accordion row + its cards ----------
  // Icons are per-category, reused on every card inside it, rather than one
  // unique icon per individual test — at 100+ tests, a bespoke icon for
  // "FT3" vs "FT4" would carry no real meaning. A reused, recognizable
  // category icon (droplet = blood work, bone = skeletal X-ray) builds the
  // mental map without inventing icons that stand for nothing.

  function buildTestCard(text, iconId) {
    const card = document.createElement('div');
    card.className = 'test-card';
    card.appendChild(iconEl(iconId, 'test-card-icon'));
    const span = document.createElement('span');
    span.className = 'test-card-name';
    span.textContent = text;
    card.appendChild(span);
    return card;
  }

  function buildCategory(cat) {
    const wrap = document.createElement('div');
    wrap.className = 'accordion-item';
    wrap.dataset.category = cat.name;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'accordion-head';
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(iconEl(cat.icon, 'accordion-icon'));

    const name = document.createElement('span');
    name.className = 'accordion-name';
    name.textContent = cat.name;

    const count = document.createElement('span');
    count.className = 'accordion-count';
    count.textContent = `${categoryTests(cat).length}`;

    const chevron = document.createElement('span');
    chevron.className = 'accordion-chevron';
    chevron.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    btn.append(name, count, chevron);

    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    const inner = document.createElement('div');
    inner.className = 'accordion-panel-inner';

    if (cat.subgroups) {
      cat.subgroups.forEach(group => {
        const groupWrap = document.createElement('div');
        groupWrap.className = 'test-subgroup';
        groupWrap.dataset.subgroup = group.name;

        const head = document.createElement('div');
        head.className = 'test-subgroup-head';
        const h4 = document.createElement('h4');
        h4.textContent = group.name;
        const n = document.createElement('span');
        n.className = 'test-subgroup-count';
        n.textContent = `${group.tests.length}`;
        head.append(h4, n);
        groupWrap.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'test-card-grid';
        group.tests.forEach(t => grid.appendChild(buildTestCard(t, cat.icon)));
        groupWrap.appendChild(grid);

        inner.appendChild(groupWrap);
      });
    } else {
      const grid = document.createElement('div');
      grid.className = 'test-card-grid';
      cat.tests.forEach(t => grid.appendChild(buildTestCard(t, cat.icon)));
      inner.appendChild(grid);
    }

    panel.appendChild(inner);
    btn.addEventListener('click', () => setOpen(wrap, btn, panel, !wrap.classList.contains('open')));
    wrap.append(btn, panel);
    return wrap;
  }

  function setOpen(wrap, btn, panel, open) {
    wrap.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '';
  }

  function buildSectionAccordion(sec) {
    const block = document.createElement('div');
    block.className = 'service-block';

    const banner = document.createElement('div');
    banner.className = 'service-banner';
    banner.appendChild(iconEl(sec.icon, 'service-banner-icon'));
    const textWrap = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = sec.title;
    const p = document.createElement('p');
    p.textContent = sec.blurb;
    textWrap.append(h2, p);
    banner.appendChild(textWrap);
    block.appendChild(banner);

    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    sec.categories.forEach(cat => accordion.appendChild(buildCategory(cat)));
    block.appendChild(accordion);

    return block;
  }

  // Filters an already-built accordion tree (for one or more sections) down
  // to a query, expanding categories/subgroups that match and hiding those
  // that don't. Returns { visibleTests, visibleCats } for a summary line.
  function filterAccordion(container, rawQuery) {
    const q = rawQuery.trim().toLowerCase();
    let visibleTests = 0;
    let visibleCats = 0;

    container.querySelectorAll('.service-block').forEach(block => {
      let blockHasMatch = false;

      block.querySelectorAll('.accordion-item').forEach(item => {
        const btn = item.querySelector('.accordion-head');
        const panel = item.querySelector('.accordion-panel');
        const catName = item.dataset.category.toLowerCase();
        let matchesInCat = 0;

        item.querySelectorAll('.test-subgroup').forEach(group => {
          let groupMatches = 0;
          group.querySelectorAll('.test-card').forEach(card => {
            const text = card.querySelector('.test-card-name').textContent.toLowerCase();
            const match = !q || text.includes(q) || catName.includes(q);
            card.style.display = match ? '' : 'none';
            if (match) groupMatches++;
          });
          group.style.display = groupMatches ? '' : 'none';
          matchesInCat += groupMatches;
        });

        item.querySelectorAll(':scope > .accordion-panel > .accordion-panel-inner > .test-card-grid > .test-card').forEach(card => {
          const text = card.querySelector('.test-card-name').textContent.toLowerCase();
          const match = !q || text.includes(q) || catName.includes(q);
          card.style.display = match ? '' : 'none';
          if (match) matchesInCat++;
        });

        const show = !q || matchesInCat > 0;
        item.style.display = show ? '' : 'none';
        if (show) { blockHasMatch = true; visibleCats++; visibleTests += matchesInCat; }

        setOpen(item, btn, panel, q.length > 0 && matchesInCat > 0);
      });

      block.style.display = blockHasMatch ? '' : 'none';
    });

    return { visibleTests, visibleCats };
  }

  // ---------- browse view: two clickable cards with category chips ----------

  function buildBrowseCard(sec) {
    const card = document.createElement('div');
    card.className = 'svc-card';

    const bannerBtn = document.createElement('button');
    bannerBtn.type = 'button';
    bannerBtn.className = 'svc-card-banner';
    bannerBtn.appendChild(iconEl(sec.icon, 'service-banner-icon'));
    const textWrap = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = sec.title;
    const p = document.createElement('p');
    p.textContent = sec.blurb;
    textWrap.append(h2, p);
    bannerBtn.appendChild(textWrap);
    const openHint = document.createElement('span');
    openHint.className = 'svc-card-open-hint';
    openHint.textContent = 'View all →';
    bannerBtn.appendChild(openHint);
    bannerBtn.addEventListener('click', () => openServiceModal(sec.id));
    card.appendChild(bannerBtn);

    const chipRow = document.createElement('div');
    chipRow.className = 'svc-chip-row';
    sec.categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'svc-chip';
      chip.dataset.category = cat.name;
      chip.textContent = `${cat.name} · ${categoryTests(cat).length}`;
      chip.addEventListener('click', () => openServiceModal(sec.id, cat.name));
      chipRow.appendChild(chip);
    });
    card.appendChild(chipRow);

    return card;
  }

  // ---------- modal ----------

  function openServiceModal(sectionId, focusCategory) {
    const sec = SERVICE_SECTIONS.find(s => s.id === sectionId);
    if (!sec || !elModal) return;

    elModalBody.innerHTML = '';

    const search = document.createElement('div');
    search.className = 'doctor-search service-modal-search';
    search.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = `Search within ${sec.title.split(' —')[0]}…`;
    search.appendChild(searchInput);
    elModalBody.appendChild(search);

    const summary = document.createElement('p');
    summary.className = 'services-summary service-modal-summary';
    elModalBody.appendChild(summary);

    const accordionBlock = buildSectionAccordion(sec);
    accordionBlock.querySelector('.service-banner').remove(); // banner already shown via the card that opened this
    elModalBody.appendChild(accordionBlock);

    const sectionTotal = sec.categories.reduce((s, c) => s + categoryTests(c).length, 0);
    function updateModalSummary(q) {
      if (!q) {
        summary.textContent = `${sectionTotal} tests across ${sec.categories.length} categories`;
        return;
      }
      const { visibleTests, visibleCats } = filterAccordion(elModalBody, q);
      summary.textContent = `${visibleTests} result${visibleTests === 1 ? '' : 's'} in ${visibleCats} categor${visibleCats === 1 ? 'y' : 'ies'}`;
    }
    searchInput.addEventListener('input', e => updateModalSummary(e.target.value));
    updateModalSummary('');

    elModal.classList.add('open');
    elModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (focusCategory) {
      const item = accordionBlock.querySelector(`.accordion-item[data-category="${CSS.escape(focusCategory)}"]`);
      if (item) {
        setOpen(item, item.querySelector('.accordion-head'), item.querySelector('.accordion-panel'), true);
        requestAnimationFrame(() => item.scrollIntoView?.({ block: 'center', behavior: 'smooth' }));
      }
    } else {
      searchInput.focus();
    }
  }

  function closeServiceModal() {
    if (!elModal) return;
    elModal.classList.remove('open');
    elModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  elModalClose?.addEventListener('click', closeServiceModal);
  elModalBackdrop?.addEventListener('click', closeServiceModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeServiceModal(); });

  // ---------- page assembly ----------

  const elBrowse = document.createElement('div');
  elBrowse.id = 'serviceBrowse';
  elBrowse.className = 'service-browse';
  SERVICE_SECTIONS.forEach(sec => elBrowse.appendChild(buildBrowseCard(sec)));

  const elResults = document.createElement('div');
  elResults.id = 'serviceResults';
  elResults.className = 'service-results';
  elResults.hidden = true;
  SERVICE_SECTIONS.forEach(sec => elResults.appendChild(buildSectionAccordion(sec)));

  elWrap.append(elBrowse, elResults);

  function applyPageSearch(rawQuery) {
    const q = rawQuery.trim();
    const searching = q.length > 0;
    elBrowse.hidden = searching;
    elResults.hidden = !searching;

    if (!searching) {
      elSummary.textContent = `${totalTests} tests across ${totalCategories} categories`;
      return;
    }
    const { visibleTests, visibleCats } = filterAccordion(elResults, q);
    elSummary.textContent = `${visibleTests} result${visibleTests === 1 ? '' : 's'} in ${visibleCats} categor${visibleCats === 1 ? 'y' : 'ies'} for “${q}”`;
  }

  elSearch?.addEventListener('input', e => applyPageSearch(e.target.value));
  applyPageSearch('');

  const params = new URL(window.location.href).searchParams;
  const initialQuery = params.get('q');
  if (initialQuery) {
    elSearch.value = initialQuery;
    applyPageSearch(initialQuery);
  }
})();