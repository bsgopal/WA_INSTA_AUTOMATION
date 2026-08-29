// Resolves the backend API base for this running instance.
// Priority: Electron preload (dynamic port) -> VITE_API_URL -> default 5000.
const win = typeof window !== 'undefined' ? window : {};
const envBase = import.meta.env.VITE_API_URL || '';

export const API_BASE =
  win.renicAPI?.apiBase ||
  envBase ||
  'http://localhost:5000/api';

export const API_ORIGIN =
  win.renicAPI?.apiOrigin ||
  envBase.replace(/\/api\/?$/, '') ||
  'http://localhost:5000';

export const API_PORT = win.renicAPI?.apiPort || 5000;
