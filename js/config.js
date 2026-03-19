// DRI Board runtime config
// For GitHub Pages, keep this empty and use localStorage override.

(() => {
  // DRI Board runtime config
  // - On GitHub Pages: API_BASE should stay empty (static demo)
  // - Locally: defaults to the Bridge backend on localhost

  const saved = localStorage.getItem('DRI_API_BASE');
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const defaultLocalApi = 'http://localhost:5055';

  window.DRI_CONFIG = {
    API_BASE: saved || (isLocal ? defaultLocalApi : ''),
  };
})();

// Helper: set in console
// localStorage.setItem('DRI_API_BASE', 'http://localhost:5055');
