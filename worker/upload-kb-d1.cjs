// Writes the knowledge base (saas-backend/private/catalog.json -> kb) into D1 table kb_parts in ~60 KB parts.
// No setup token needed: uses your wrangler login.  node worker/upload-kb-d1.cjs  (then the worker picks it up on next cold start)
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const { kb } = JSON.parse(fs.readFileSync(path.join(__dirname, "../saas-backend/private/catalog.json"), "utf8"));
if (!kb || kb.version !== 2) { console.error("catalog.json has no knowledge base"); process.exit(1); }
const text = JSON.stringify(kb), size = 60000, q = s => "'" + s.replace(/'/g, "''") + "'";
const sql = ["CREATE TABLE IF NOT EXISTS kb_parts (part INTEGER PRIMARY KEY, body TEXT NOT NULL);", "DELETE FROM kb_parts;"];
for (let i = 0, p = 0; i < text.length; i += size, p++) sql.push(`INSERT INTO kb_parts (part, body) VALUES (${p}, ${q(text.slice(i, i + size))});`);
const file = path.join(os.tmpdir(), "bizmatrix-kb.sql"); fs.writeFileSync(file, sql.join("\n"));
execFileSync("npx", ["wrangler", "d1", "execute", "bizmatrix", "--remote", "--file", file, "-y"], { stdio: "inherit", shell: true, cwd: path.join(__dirname, "..") });
fs.unlinkSync(file); console.log("kb parts:", sql.length - 2, "bytes:", text.length);
