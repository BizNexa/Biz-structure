// One-off: replace every green colour with navy/brass/neutral tokens (Phase 3).
// Greens (hue 90°–175°) map to the nearest step of the navy ladder by lightness; near-white tints map to warm
// neutrals; the old gold accents map to the brass ladder. rgba() greens keep their alpha on a navy rgb token.
const fs = require("fs");
const files = process.argv.slice(2);
const LADDER = [["--navy-50", 96], ["--navy-100", 92], ["--navy-200", 83], ["--navy-300", 71], ["--navy-400", 56], ["--navy-500", 42], ["--navy-600", 32], ["--navy-700", 26], ["--navy-800", 21], ["--navy-900", 16], ["--navy-950", 10]];
const GOLD = { "#c9a227": "var(--brass-400)", "#e9c46a": "var(--brass-300)", "#e0bc4a": "var(--brass-300)", "#d9a441": "var(--brass-300)", "#b8892b": "var(--brass-600)", "#9a6b12": "var(--brass-700)", "#82590e": "var(--brass-800)", "#f6ebc8": "var(--brass-100)", "#f5ecd9": "var(--brass-100)" };
function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s * 100, l * 100]; }
const isGreen = (r, g, b) => { const [h, s] = hsl(r, g, b); return h >= 90 && h <= 178 && s > 6; };
function token(r, g, b) { const L = hsl(r, g, b)[2]; if (L >= 97.5) return "var(--paper)"; let best = LADDER[0]; for (const t of LADDER) if (Math.abs(t[1] - L) < Math.abs(best[1] - L)) best = t; return "var(" + best[0] + ")"; }
const hex = h => { h = h.slice(1); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
let total = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8"), n = 0;
  s = s.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g, m => {
    const low = m.toLowerCase(); if (GOLD[low]) { n++; return GOLD[low]; }
    if (/&#\d/.test(m)) return m;
    const [r, g, b] = hex(low); if ([r, g, b].some(isNaN) || !isGreen(r, g, b)) return m; n++; return token(r, g, b);
  });
  s = s.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g, (m, r, g, b, a) => {
    r = +r; g = +g; b = +b; if (!isGreen(r, g, b)) return m; n++; const L = hsl(r, g, b)[2];
    return L < 15 ? `rgba(var(--navy-950-rgb),${a})` : `rgba(var(--navy-700-rgb),${a})`;
  });
  fs.writeFileSync(f, s); total += n; console.log(f, n);
}
console.log("replaced", total);
