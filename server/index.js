/**
 * Local Live-mode server. Vercel does not run this file.
 * It loads server/.env, then listens. The routes live in ./app.js.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import { hasJevKey } from './adapters/jev.js';
import { hasLlmKey } from './adapters/llm.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '.env') });

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(
    `[server] OPENROUTER_API_KEY ${hasJevKey() && hasLlmKey() ? 'set' : 'MISSING'}`
  );
});
