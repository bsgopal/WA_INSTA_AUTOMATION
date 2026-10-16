// Resolves the backend API base for this running instance.
// Priority: Electron preload (dynamic port) -> VITE_API_URL -> default 5000.
const win = typeof window !== 'undefined' ? window : {};
let envBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';

// GUARD: If VITE_API_URL was accidentally set to the WAHA container on Railway,
// route API traffic to the actual Renic Automation backend API instead!
if (envBase.includes('railway.app') || envBase.includes('devlikeaprowaha') || envBase.includes(':3000')) {
  console.warn('⚠️ [API Gateway] Detected Railway WAHA URL in VITE_API_URL. Correcting API base to Renic Automation backend.');
  envBase = 'https://wa-insta-automation.vercel.app/api';
}

// In production web environments (e.g. hosted on Vercel), default to the production backend
const isProductionWeb = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

const defaultBase = isProductionWeb ? 'https://wa-insta-automation.vercel.app/api' : 'http://localhost:5000/api';
const defaultOrigin = isProductionWeb ? 'https://wa-insta-automation.vercel.app' : 'http://localhost:5000';

export const API_BASE =
  win.renicAPI?.apiBase ||
  (envBase ? (envBase.endsWith('/api') ? envBase : `${envBase.replace(/\/+$/, '')}/api`) : defaultBase);

export const API_ORIGIN =
  win.renicAPI?.apiOrigin ||
  (envBase ? envBase.replace(/\/api\/?$/, '') : defaultOrigin);

export const API_PORT = win.renicAPI?.apiPort || 5000;
