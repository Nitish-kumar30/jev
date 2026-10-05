/**
 * Thin browser-side client for the optional backend. No API keys ever reach
 * this file — the browser only talks to our own /api/* routes.
 */

const TIMEOUT_MS = 30000;

async function request(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.code = data.code;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const classifyWithJev = (message) => request('/api/jev/classify', { message });
export const classifyWithLlm = (message) => request('/api/llm/classify', { message });
export const gateWithJev = (payload) => request('/api/jev/gate', payload);
export const runExample = (n) => request(`/api/examples/${n}`, {});
export const detectPii = (message) => request('/api/pii', { message });

/**
 * Used before switching to Live mode: confirms the backend is up and that it
 * has the keys it needs. Anything else keeps us in Demo mode.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    if (!res.ok) return { ok: false, reason: `Backend responded with ${res.status}.` };
    const data = await res.json();
    if (!data.jevKey && !data.llmKey) {
      return {
        ok: false,
        reason: 'Backend is running but no API keys are set in server/.env.',
      };
    }
    if (!data.jevKey || !data.llmKey) {
      return {
        ok: true,
        partial: true,
        reason: 'Only one of the two API keys is set; the other side stays simulated.',
        ...data,
      };
    }
    return { ok: true, ...data };
  } catch {
    return {
      ok: false,
      reason: 'No backend detected on /api. Start it with `npm run server`.',
    };
  }
}
