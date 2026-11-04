// Resolves the backend API base for this running instance.
// Priority: Electron preload (dynamic port) -> VITE_API_URL -> default 5000.
const win = typeof window !== 'undefined' ? window : {};
let envBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';

// In production web environments (e.g. hosted on Vercel or custom domain), default to current origin
const isProductionWeb = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

const defaultBase = isProductionWeb ? `${window.location.origin}/api` : 'http://localhost:5000/api';
const defaultOrigin = isProductionWeb ? window.location.origin : 'http://localhost:5000';

// GUARD: If VITE_API_URL was accidentally set to a standalone WAHA container (e.g. port 3000 or devlikeaprowaha),
// route frontend API traffic to the actual Renic Automation backend API instead!
if (envBase && (envBase.includes('devlikeaprowaha') || (envBase.includes('waha') && !envBase.includes('/api')) || (envBase.includes(':3000') && !envBase.includes(':5000')))) {
  console.warn('⚠️ [API Gateway] Detected WAHA container URL in VITE_API_URL. Correcting API base to Renic Automation backend.');
  envBase = defaultBase;
}

export const API_BASE =
  win.renicAPI?.apiBase ||
  (envBase ? (envBase.endsWith('/api') ? envBase : `${envBase.replace(/\/+$/, '')}/api`) : defaultBase);

export const API_ORIGIN =
  win.renicAPI?.apiOrigin ||
  (envBase ? envBase.replace(/\/api\/?$/, '') : defaultOrigin);

export const API_PORT = win.renicAPI?.apiPort || 5000;
