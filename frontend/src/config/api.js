/**
 * MuleNet AI - Frontend API Configuration & Health Service
 * 
 * Provides centralized backend base URL resolution:
 * 1. Runtime override: Checks `localStorage.getItem('mulenet_custom_api_url')`
 *    (allows live production testing/switching without rebuilding).
 * 2. Build-time environment variable: `import.meta.env.VITE_API_URL`
 * 3. Local Development: Automatically falls back to `http://localhost:8000`
 * 4. Production Default: Empty string (relative path)
 */

export function getCustomApiUrl() {
  if (typeof window === 'undefined') return '';
  try {
    const val = window.localStorage.getItem('mulenet_custom_api_url');
    return val && typeof val === 'string' ? val.trim().replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
}

export function setCustomApiUrl(url) {
  if (typeof window === 'undefined') return;
  try {
    if (!url || !url.trim()) {
      window.localStorage.removeItem('mulenet_custom_api_url');
    } else {
      window.localStorage.setItem('mulenet_custom_api_url', url.trim().replace(/\/+$/, ''));
    }
    // Dispatch custom event to notify listeners across the app
    window.dispatchEvent(new Event('mulenet-api-url-changed'));
  } catch (err) {
    console.error('Failed to update custom API URL in localStorage:', err);
  }
}

export function getApiBaseUrl() {
  // 1. Runtime user override
  const custom = getCustomApiUrl();
  if (custom) return custom;

  // 2. Vite environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Fallback for local development
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return 'http://localhost:8000';
  }

  // 4. In production without VITE_API_URL, return empty string for relative proxy
  return '';
}

// Retain export for backward compatibility with components importing API_BASE_URL
export const API_BASE_URL = getApiBaseUrl();

/**
 * Constructs the fully resolved URL for any API endpoint.
 * Handles slashes and prevents duplicate `/api/api` if the base URL already ends with `/api`.
 * 
 * @param {string} endpoint - The API endpoint path, e.g. '/api/dataset/upload'
 * @returns {string} The resolved API URL
 */
export function getApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  if (!endpoint) return baseUrl;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!baseUrl) {
    return path;
  }

  // If baseUrl already ends with '/api' and path begins with '/api', strip the duplicate
  if (baseUrl.endsWith('/api') && path.startsWith('/api')) {
    return `${baseUrl}${path.slice(4)}`;
  }

  return `${baseUrl}${path}`;
}

/**
 * Diagnostics helper returning current configuration sources.
 */
export function getApiConfigInfo() {
  const custom = getCustomApiUrl();
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  const baseUrl = getApiBaseUrl();
  const isDev = Boolean(import.meta.env.DEV || import.meta.env.MODE === 'development');

  return {
    effectiveUrl: baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'Relative Path'),
    rawBaseUrl: baseUrl,
    customUrl: custom,
    envUrl: envUrl,
    isDev,
    isConfigured: Boolean(custom || envUrl || isDev)
  };
}

/**
 * Performs a real health check against the backend `/health` (or `/api/health`) endpoint.
 * Accurately detects:
 * - 'online': Real backend responded with valid JSON and success status
 * - 'connecting': In flight
 * - 'disconnected': Network error, connection refused, timeout, or received HTML from Vercel SPA rewrite
 * - 'error': HTTP 5xx or invalid error payload
 * 
 * @param {number} timeoutMs - Timeout in milliseconds (default: 6000)
 * @returns {Promise<{ ok: boolean, status: 'online'|'disconnected'|'error', data: any, message: string, statusCode: number|null }>}
 */
export async function checkBackendHealth(timeoutMs = 6000) {
  const targetUrl = getApiUrl('/health');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // If server returned HTML (such as Vercel index.html fallback rewrite)
    if (contentType.includes('text/html')) {
      return {
        ok: false,
        status: 'disconnected',
        data: null,
        message: 'Backend endpoint returned HTML instead of JSON. In production, configure VITE_API_URL with your deployed backend URL.',
        statusCode: res.status
      };
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      return {
        ok: false,
        status: 'error',
        data: null,
        message: `Backend returned non-JSON response (HTTP ${res.status}).`,
        statusCode: res.status
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: 'error',
        data,
        message: data?.detail || data?.message || `Backend returned HTTP ${res.status}.`,
        statusCode: res.status
      };
    }

    // Verify response indicates healthy backend
    const isOnline = data?.status === 'ONLINE' || data?.status === 'ok' || data?.healthy === true;
    if (isOnline) {
      return {
        ok: true,
        status: 'online',
        data,
        message: 'Backend is healthy and connected.',
        statusCode: res.status
      };
    }

    return {
      ok: false,
      status: 'error',
      data,
      message: data?.message || 'Backend returned an unexpected health status.',
      statusCode: res.status
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        ok: false,
        status: 'disconnected',
        data: null,
        message: `Health check timed out after ${timeoutMs / 1000}s. Backend service is unresponsive.`,
        statusCode: null
      };
    }

    return {
      ok: false,
      status: 'disconnected',
      data: null,
      message: err.message ? `Connection failed: ${err.message}` : 'Network error: Backend unreachable.',
      statusCode: null
    };
  }
}

export { getApiUrl as apiUrl };
export default getApiUrl;
