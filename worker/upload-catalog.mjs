import { readFileSync } from 'node:fs';

const url = process.env.WORKER_URL;
const token = process.env.SETUP_TOKEN;
if (!url || !token) {
  console.error('Set WORKER_URL and SETUP_TOKEN in this command. Do not save them in the repository.');
  process.exit(1);
}
const catalog = JSON.parse(readFileSync(new URL('../saas-backend/private/catalog.json', import.meta.url), 'utf8'));
const thin = Object.keys(catalog.entities || {}).length < 7 || Object.values(catalog.entities).some(e => !e.name || !e.tax);
if (thin) {
  console.error('Refusing to upload: this catalog has no premium entity text (name, tax, audit, membership). Paid users would lose it.');
  console.error('Rebuild with: node tools/build-kb.cjs ... --base <current private catalog.json>');
  process.exit(1);
}
const response = await fetch(new URL('/api/setup/catalog', url), {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
  body: JSON.stringify(catalog)
});
const text = await response.text();
console.log(response.status);
console.log(text.slice(0, 300));
if (!response.ok) process.exit(1);
