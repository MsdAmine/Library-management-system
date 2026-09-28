import axios from 'axios';

// ---------------------------------------------------------------------------
// Base URL — driven by the VITE_API_BASE_URL environment variable so every
// deployment target (dev / staging / production) can provide its own value
// without touching source code.
// ---------------------------------------------------------------------------
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Toast notification helper — lightweight, dependency-free implementation
// that injects a small, auto-dismissing banner at the top of the screen.
// ---------------------------------------------------------------------------

/** @param {'error'|'warning'|'info'} type */
function showToast(message, type = 'error') {
  const colours = {
    error:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '🚫' },
    warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: '⚠️' },
    info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', icon: 'ℹ️' },
  };
  const c = colours[type] ?? colours.error;

  const existing = document.getElementById('_axios-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = '_axios-toast';
  Object.assign(toast.style, {
    position:     'fixed',
    top:          '1rem',
    left:         '50%',
    transform:    'translateX(-50%)',
    zIndex:       '99999',
    display:      'flex',
    alignItems:   'center',
    gap:          '0.5rem',
    padding:      '0.75rem 1.25rem',
    background:   c.bg,
    border:       `1px solid ${c.border}`,
    borderRadius: '0.75rem',
    color:        c.text,
    fontFamily:   'system-ui, sans-serif',
    fontSize:     '0.875rem',
    fontWeight:   '600',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.12)',
    maxWidth:     '90vw',
    whiteSpace:   'pre-wrap',
    opacity:      '0',
    transition:   'opacity 0.2s ease',
  });

  toast.innerHTML = `<span>${c.icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  // Auto-dismiss after 5 s
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 5000);
}

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT from localStorage on every outgoing call.
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — centralised HTTP error handling.
//
//  401 Unauthorized — Session expired or token invalid.
//    • Clears all authentication artefacts from localStorage.
//    • Uses the History API (replaceState) to navigate to /login with a
//      `sessionExpired=true` query-param so the Login page can surface a
//      contextual message — avoids the abrupt full page reload caused by
//      window.location.href assignment.
//
//  403 Forbidden — Valid session but insufficient permissions.
//    • Does NOT clear the session (the token is still valid).
//    • Surfaces a user-friendly "Access Denied" toast instead of letting the
//      rejection bubble up as an unhandled promise rejection.
//    • Navigates to /unauthorized if the current path is not already there.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // --- 401: Session expired / token invalid ---
    if (status === 401) {
      // Clear every authentication artefact
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');

      // Only redirect if we are not already on the login page
      if (window.location.pathname !== '/login') {
        // Use History API for a clean, SPA-friendly navigation with state
        // This avoids a hard reload while still informing the Login page.
        window.history.replaceState(
          { sessionExpired: true },
          '',
          '/login?sessionExpired=true'
        );
        // Dispatch a popstate event so React Router picks up the change
        window.dispatchEvent(new PopStateEvent('popstate', { state: { sessionExpired: true } }));
      }
    }

    // --- 403: Authenticated but not authorised ---
    if (status === 403) {
      showToast('Access Denied — you do not have permission to perform this action.', 'error');

      // Navigate to the dedicated unauthorised page if not already there
      if (
        window.location.pathname !== '/unauthorized' &&
        window.location.pathname !== '/login'
      ) {
        window.history.replaceState({}, '', '/unauthorized');
        window.dispatchEvent(new PopStateEvent('popstate', {}));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
