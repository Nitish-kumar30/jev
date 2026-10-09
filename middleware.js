/**
 * Password gate for the Vercel deployment. Runs before the vercel.json
 * rewrites, so the page, static files, and /api/* stay locked until the
 * visitor enters SITE_PASSWORD. Local `npm run dev` does not load this file.
 */
import { next as continueRequest } from '@vercel/functions';

const COOKIE = 'jev_gate';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

const configuredPassword = () => {
  const value = process.env.SITE_PASSWORD;
  return typeof value === 'string' && value.length > 0 ? value : null;
};

const bytesToBase64Url = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const sha256 = async (text) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
};

/** Equal-length compare. Hash both passwords first so their lengths never reach this loop. */
const fixedTimeEqual = (left, right) => {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
};

const passwordMatches = async (submitted, expected) => {
  const [left, right] = await Promise.all([sha256(submitted), sha256(expected)]);
  return fixedTimeEqual(left, right);
};

const hmac = async (secret, value) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
};

const textBytes = (value) => new TextEncoder().encode(value);

const readCookie = (request, name) => {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    try {
      return decodeURIComponent(trimmed.slice(eq + 1));
    } catch {
      return '';
    }
  }
  return '';
};

const hasValidCookie = async (request, password) => {
  const raw = readCookie(request, COOKIE);
  const dot = raw.indexOf('.');
  if (dot <= 0) return false;
  const exp = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) <= Date.now()) return false;
  const expected = await hmac(password, exp);
  return fixedTimeEqual(textBytes(signature), textBytes(expected));
};

/** Same-origin path only, so the post-login redirect cannot leave the site. */
const safeNext = (value) => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000\r\n]/.test(value)
  ) {
    return '/';
  }
  try {
    const url = new URL(value, 'https://gate.local');
    if (url.origin !== 'https://gate.local') return '/';
    return `${url.pathname}${url.search}`;
  } catch {
    return '/';
  }
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const page = ({ unconfigured = false, error = '', nextPath = '/' }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Password · Jev</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2305060f'/%3E%3Ctext x='16' y='23' font-family='monospace' font-size='20' font-weight='bold' text-anchor='middle' fill='%2322e6ff'%3EJ%3C/text%3E%3C/svg%3E" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #05060f;
      color: #e6ecff;
      font-family: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
    }
    main { width: min(100% - 2rem, 22rem); }
    h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 0.5rem; }
    p { margin: 0 0 1.25rem; color: #9aa6c8; line-height: 1.5; }
    .error { color: #fca5a5; margin: 0 0 1rem; }
    label { display: block; font-size: 0.875rem; margin-bottom: 0.4rem; }
    input {
      width: 100%;
      padding: 0.7rem 0.8rem;
      border-radius: 0.6rem;
      border: 1px solid #1c2547;
      background: #080b1c;
      color: inherit;
      font: inherit;
    }
    button {
      margin-top: 0.9rem;
      width: 100%;
      padding: 0.7rem 0.8rem;
      border: 0;
      border-radius: 0.6rem;
      background: #22e6ff;
      color: #05060f;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    :focus-visible { outline: 2px solid #22e6ff; outline-offset: 2px; }
  </style>
</head>
<body>
  <main>
    <h1>This demo is locked</h1>
    ${
      unconfigured
        ? '<p>SITE_PASSWORD is not set on this deployment, so the site stays closed.</p>'
        : `<p>Enter the shared password to continue.</p>
    ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
    <form method="post" action="/api/unlock">
      <input type="hidden" name="next" value="${escapeHtml(nextPath)}" />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">Unlock</button>
    </form>`
    }
  </main>
</body>
</html>`;

const htmlResponse = (body, status) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const cookieHeader = (exp, signature) =>
  `${COOKIE}=${exp}.${signature}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SEC}`;

const handleUnlock = async (request, password) => {
  if (!password) return htmlResponse(page({ unconfigured: true }), 503);

  let submitted = '';
  let nextPath = '/';
  try {
    const form = await request.formData();
    submitted = String(form.get('password') ?? '');
    nextPath = safeNext(String(form.get('next') ?? '/'));
  } catch {
    return htmlResponse(page({ error: 'Enter the password.', nextPath: '/' }), 400);
  }

  if (!(await passwordMatches(submitted, password))) {
    return htmlResponse(page({ error: 'Wrong password.', nextPath }), 401);
  }

  const exp = String(Date.now() + MAX_AGE_SEC * 1000);
  const signature = await hmac(password, exp);
  return new Response(null, {
    status: 303,
    headers: {
      Location: nextPath,
      'Set-Cookie': cookieHeader(exp, signature),
      'Cache-Control': 'no-store',
    },
  });
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = configuredPassword();

  if (url.pathname === '/api/unlock' && request.method === 'POST') {
    return handleUnlock(request, password);
  }

  if (password && (await hasValidCookie(request, password))) return continueRequest();

  const nextPath = safeNext(`${url.pathname}${url.search}`);
  if (!password) return htmlResponse(page({ unconfigured: true }), 503);
  return htmlResponse(page({ nextPath }), 401);
}
