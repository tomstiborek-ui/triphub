// Sypačky (Tom 2026-10-14): turn one road GPX into a ROADS entry for index.html.
// Run: node trips/tools/mk_road.js road.gpx id "Name" > entry.json   (prints {id,n,km,climb,min,max,prof,line})
const fs = require('fs');
const [file, id = "road", n = ""] = process.argv.slice(2);
const x = fs.readFileSync(file, 'utf8');
const P = [...x.matchAll(/<(?:trkpt|rtept) lat="([-\d.]+)" lon="([-\d.]+)"\s*>\s*(?:<ele>([-\d.]+)<\/ele>)?/g)].map(m => [+m[2], +m[1], m[3] == null ? null : +m[3]]);
if (P.length < 2) throw new Error("no track points in " + file);
const R = 6371, dist = [0];
for (let i = 1; i < P.length; i++){ const a = P[i-1], b = P[i], dl = (b[1]-a[1])*Math.PI/180, dn = (b[0]-a[0])*Math.PI/180;
  const h = Math.sin(dl/2)**2 + Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.sin(dn/2)**2; dist.push(dist[i-1] + 2*R*Math.asin(Math.sqrt(h))); }
const km = dist.at(-1), hasEle = P.some(p => p[2] != null), e = P.map(p => p[2] ?? 0);
let up = 0; for (let i = 1; i < P.length; i++){ const d = e[i] - e[i-1]; if (d > 0) up += d; }
const prof = []; let j = 0; for (let k = 0; k <= 60; k++){ const t = km*k/60; while (j < P.length-1 && dist[j+1] < t) j++; prof.push(Math.round(e[j])); }
// Douglas-Peucker in 4 chunks (a whole loop whose start equals its end would otherwise collapse), up to ~400 points.
function dp(pts, eps){ if (pts.length < 3) return pts; let mx = 0, ix = 0; const a = pts[0], b = pts.at(-1);
  for (let i = 1; i < pts.length-1; i++){ const p = pts[i], dx = b[0]-a[0], dy = b[1]-a[1]; const d = Math.abs(dy*p[0] - dx*p[1] + b[0]*a[1] - b[1]*a[0]) / (Math.hypot(dx, dy) || 1e-12); if (d > mx){ mx = d; ix = i; } }
  return mx > eps ? [...dp(pts.slice(0, ix+1), eps).slice(0, -1), ...dp(pts.slice(ix), eps)] : [a, b]; }
const chunks = 4, size = Math.ceil(P.length / chunks);
let eps = 0.00008, line;
for (;;){ line = []; for (let c = 0; c < chunks; c++){ const part = P.slice(c*size, Math.min(P.length, (c+1)*size + 1)); if (part.length) line.push(...(c ? dp(part, eps).slice(1) : dp(part, eps))); } if (line.length <= 400) break; eps *= 1.3; }
const out = {id, n, km:+km.toFixed(1), line:line.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)])};
if (hasEle) Object.assign(out, {climb:Math.round(up), min:Math.round(Math.min(...e)), max:Math.round(Math.max(...e)), prof});
console.log(JSON.stringify(out));
