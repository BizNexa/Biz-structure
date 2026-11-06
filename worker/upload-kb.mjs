// Adds the knowledge base (registrations, compliances, checklists) to the live premium catalog.
// The premium entity text already on the server is kept. Usage (PowerShell):
//   $env:WORKER_URL="https://<your-worker>"; $env:SETUP_TOKEN="<setup token>"; node worker/upload-kb.mjs
import { readFileSync } from 'node:fs';
const url = process.env.WORKER_URL, token = process.env.SETUP_TOKEN;
if (!url || !token) { console.error('Set WORKER_URL and SETUP_TOKEN in this command. Do not save them in the repository.'); process.exit(1); }
const { kb } = JSON.parse(readFileSync(new URL('../saas-backend/private/catalog.json', import.meta.url), 'utf8'));
if (!kb || kb.version !== 2) { console.error('saas-backend/private/catalog.json has no knowledge base. Rebuild it with tools/build-kb.cjs.'); process.exit(1); }
const res = await fetch(new URL('/api/setup/kb', url), { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(kb) });
console.log(res.status, (await res.text()).slice(0, 300));
if (!res.ok) process.exit(1);
