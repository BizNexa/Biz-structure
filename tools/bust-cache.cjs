// Stamp every local CSS/JS reference in the published pages with ?v=<build> so browsers fetch
// fresh files after each deploy. Run before every push: node tools/bust-cache.cjs
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const skip = new Set(["_gst-checker-src", "gst-registration-checker", "github-pages-deployment", "saas-frontend", "_design", "node_modules", "worker", "tools", "tests", "saas-backend", ".claude", ".git"]);
const pages = ["index.html", ...fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && !skip.has(d.name) && fs.existsSync(path.join(ROOT, d.name, "index.html"))).map(d => d.name + "/index.html")];
let changed = 0;
for (const f of pages) {
  const file = path.join(ROOT, f); let s = fs.readFileSync(file, "utf8");
  const out = s.replace(/((?:href|src)=")((?:\.\.\/)?(?:css|js)\/[A-Za-z0-9._-]+\.(?:css|js))(?:\?v=[^"]*)?(")/g, (m, a, p, z) => {
    const local = path.join(ROOT, p.replace(/^\.\.\//, ""));
    if (!fs.existsSync(local)) return m;
    const v = crypto.createHash("sha1").update(fs.readFileSync(local)).digest("hex").slice(0, 8); // content hash: changes only when the file changes
    return a + p + "?v=" + v + z;
  });
  if (out !== s) { fs.writeFileSync(file, out); changed++; }
}
console.log("pages stamped:", changed, "of", pages.length);
