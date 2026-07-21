
(() => {
  const root = document.documentElement;
  let stored = null;
  try { stored = localStorage.getItem('subsolo-theme'); } catch (_) { stored = null; }
  if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const sync = () => {
      const dark = root.dataset.theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.textContent = dark ? 'Papel claro' : 'Inverter papel';
    };
    sync();
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('subsolo-theme', root.dataset.theme); } catch (_) {}
      document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
        const dark = root.dataset.theme === 'dark';
        b.setAttribute('aria-pressed', String(dark));
        b.textContent = dark ? 'Papel claro' : 'Inverter papel';
      });
    });
  });

  document.querySelectorAll('[data-expand]').forEach((button) => {
    const target = document.getElementById(button.dataset.expand);
    if (!target) return;
    button.addEventListener('click', () => {
      const opening = target.hidden;
      target.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
    });
  });

  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const targets = tocLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    targets.forEach(t => observer.observe(t));
  }

  const searchInput = document.querySelector('[data-search-input]');
  const typeFilter = document.querySelector('[data-search-type]');
  const channelFilter = document.querySelector('[data-search-channel]');
  const results = [...document.querySelectorAll('[data-search-result]')];
  const count = document.querySelector('[data-search-count]');
  const empty = document.querySelector('[data-search-empty]');
  const applySearch = () => {
    if (!results.length) return;
    const query = (searchInput?.value || '').trim().toLocaleLowerCase('pt-BR');
    const type = typeFilter?.value || '';
    const channel = channelFilter?.value || '';
    let visible = 0;
    results.forEach((item) => {
      const text = (item.dataset.searchText || item.textContent).toLocaleLowerCase('pt-BR');
      const matches = (!query || text.includes(query)) && (!type || item.dataset.type === type) && (!channel || item.dataset.channel === channel);
      item.hidden = !matches;
      if (matches) visible++;
    });
    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
  };
  [searchInput, typeFilter, channelFilter].filter(Boolean).forEach(el => el.addEventListener('input', applySearch));
  applySearch();

  const archiveChannel = document.querySelector('[data-archive-channel]');
  const archiveType = document.querySelector('[data-archive-type]');
  const archiveItems = [...document.querySelectorAll('[data-archive-item]')];
  const applyArchive = () => {
    if (!archiveItems.length) return;
    const channel = archiveChannel?.value || '';
    const type = archiveType?.value || '';
    archiveItems.forEach(item => {
      item.hidden = !((!channel || item.dataset.channel === channel) && (!type || item.dataset.type === type));
    });
    document.querySelectorAll('[data-archive-month]').forEach(month => {
      const any = [...month.querySelectorAll('[data-archive-item]')].some(item => !item.hidden);
      month.hidden = !any;
    });
  };
  [archiveChannel, archiveType].filter(Boolean).forEach(el => el.addEventListener('input', applyArchive));
  applyArchive();
})();
