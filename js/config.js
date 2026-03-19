// DRI Board runtime config
// For GitHub Pages, keep this empty and use localStorage override.

window.DRI_CONFIG = {
  API_BASE: localStorage.getItem('DRI_API_BASE') || '',
};

// Helper: set in console
// localStorage.setItem('DRI_API_BASE', 'http://localhost:5055');
