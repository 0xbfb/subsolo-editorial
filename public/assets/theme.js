(() => {
  const root = document.documentElement;
  root.classList.add('js');
  try {
    const stored = localStorage.getItem('subsolo-theme');
    if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;
  } catch (_) {
    // Theme persistence is optional; reading remains available without storage.
  }

  const bind = () => {
    const buttons = [...document.querySelectorAll('[data-theme-toggle]')];
    const sync = () => {
      const dark = root.dataset.theme === 'dark';
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(dark));
        button.textContent = dark ? 'Papel claro' : 'Inverter papel';
      }
    };
    sync();
    for (const button of buttons) {
      button.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('subsolo-theme', root.dataset.theme);
        } catch (_) {
          // The preference remains in memory for this page when storage is blocked.
        }
        sync();
      });
    }
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
