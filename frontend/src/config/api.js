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

export function isBackendConfigured() {
  const custom = getCustomApiUrl();
  if (custom) return true;

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return true;

  if (import.meta.env.DEV || import.meta.env.MODE === 'development') return true;

  return false;
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

  // 4. In production without VITE_API_URL, return empty string (unconfigured)
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
  const configured = isBackendConfigured();

  return {
    effectiveUrl: baseUrl || (configured ? 'Relative Path' : 'Not Configured (Requires VITE_API_URL)'),
    configuredUrl: baseUrl,
    rawBaseUrl: baseUrl,
    customUrl: custom,
    envUrl: envUrl,
    isDev,
    isConfigured: configured
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
      const displayUrl = targetUrl.startsWith('http') ? targetUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${targetUrl}`;
      return {
        ok: false,
        status: 'disconnected',
        data: null,
        message: `Endpoint returned HTML instead of JSON. Backend service is not active at ${displayUrl}. Set VITE_API_URL in Vercel to point to your deployed backend.`,
        statusCode: res.status
      };
    }

    let rawText = '';
    try {
      rawText = await res.text();
    } catch (readErr) {
      return {
        ok: false,
        status: 'disconnected',
        data: null,
        message: `Failed to read health response: ${readErr.message}`,
        statusCode: res.status
      };
    }

    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      // If server returned plain text 404 (e.g. Vercel NOT_FOUND)
      if (res.status === 404) {
        const displayUrl = targetUrl.startsWith('http') ? targetUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${targetUrl}`;
        return {
          ok: false,
          status: 'disconnected',
          data: null,
          message: `Health route returned HTTP 404. No backend service is answering at ${displayUrl}. Deploy backend to Render/Railway and set VITE_API_URL in Vercel, or set custom URL in Settings.`,
          statusCode: 404
        };
      }
      return {
        ok: false,
        status: 'error',
        data: null,
        message: `Backend returned non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 100)}`,
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
