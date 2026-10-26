/**
 * MuleNet AI - Frontend API Configuration
 * 
 * Provides centralized backend base URL resolution with local development fallback:
 * - Production (Vercel / Cloud): Uses `import.meta.env.VITE_API_URL`
 * - Local Development: Automatically falls back to `http://localhost:8000`
 * - Production Fallback: Empty string (relative path) to support vercel.json rewrite proxy
 */

const getInitialBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Fallback for local development
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return 'http://localhost:8000';
  }

  // In production if VITE_API_URL is omitted, use relative path (e.g. for vercel.json rewrites)
  return '';
};

export const API_BASE_URL = getInitialBaseUrl();

/**
 * Constructs the fully resolved URL for any API endpoint.
 * Handles slashes and prevents duplicate `/api/api` if the base URL already ends with `/api`.
 * 
 * @param {string} endpoint - The API endpoint path, e.g. '/api/dataset/upload'
 * @returns {string} The resolved API URL
 */
export function getApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!API_BASE_URL) {
    return path;
  }

  // If API_BASE_URL already ends with '/api' and path begins with '/api', strip the duplicate
  if (API_BASE_URL.endsWith('/api') && path.startsWith('/api')) {
    return `${API_BASE_URL}${path.slice(4)}`;
  }

  return `${API_BASE_URL}${path}`;
}

export { getApiUrl as apiUrl };
export default getApiUrl;
