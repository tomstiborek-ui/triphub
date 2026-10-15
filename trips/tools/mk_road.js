// Sypačky (Tom 2026-10-14): turn one road GPX into a ROADS entry for index.html.
// Run: node trips/tools/mk_road.js road.gpx id "Name" > entry.json   (prints {id,n,km,climb,min,max,prof,line} plus geometry stats:
// turns = bends of 30°+, sharp = of 90°+, hairpins = of 150°+, curv = degrees of turning per km, straight = longest straight in km,
// grade = steepest climb in % over 100 m, avg = average gradient of the climbs in %; Tom 2026-10-15)
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
// Geometry stats: resample every 10 m, follow the heading; a bend is a run of turning (>2.5° per 10 m, so a radius under ~230 m)
// in one direction that adds up to 30°+. Straights are stretches with under 10° of turning per 100 m.
{
  const STEP = 0.01, rs = []; let k = 0;
  for (let t = 0; t <= km; t += STEP){ while (k < P.length-2 && dist[k+1] < t) k++; const f = (t - dist[k]) / ((dist[k+1] - dist[k]) || 1e-9);
    rs.push([P[k][0] + (P[k+1][0]-P[k][0])*f, P[k][1] + (P[k+1][1]-P[k][1])*f, e[k] + (e[k+1]-e[k])*f]); }
  const cl = Math.cos(P[0][1]*Math.PI/180), hd = [];
  for (let i = 1; i < rs.length; i++) hd.push(Math.atan2((rs[i][0]-rs[i-1][0])*cl, rs[i][1]-rs[i-1][1]) * 180/Math.PI);
  const dh = []; for (let i = 1; i < hd.length; i++){ let d = hd[i] - hd[i-1]; d = ((d + 540) % 360) - 180; dh.push(d); }
  const sm = dh.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i-1); j <= Math.min(dh.length-1, i+1); j++){ s += dh[j]; n++; } return s / n; });
  // Turning per km on a 50 m grid, so GPX jitter on straights doesn't count as turning.
  const curv50 = () => { let a = 0; for (let i = 10; i < rs.length; i += 5){ const h1 = Math.atan2((rs[i-5][0]-rs[i-10][0])*cl, rs[i-5][1]-rs[i-10][1]), h2 = Math.atan2((rs[i][0]-rs[i-5][0])*cl, rs[i][1]-rs[i-5][1]);
    let d = (h2 - h1) * 180/Math.PI; d = ((d + 540) % 360) - 180; a += Math.abs(d); } return a; };
  const bends = []; let run = 0, sign = 0;
  for (const d of sm){ const sg = Math.sign(d);
    if (Math.abs(d) > 2.5 && (sg === sign || !sign)){ run += d; sign = sg; }
    else { if (Math.abs(run) >= 30) bends.push(Math.abs(run)); run = Math.abs(d) > 2.5 ? d : 0; sign = Math.abs(d) > 2.5 ? sg : 0; } }
  if (Math.abs(run) >= 30) bends.push(Math.abs(run));
  let best = 0, cur = 0; const W = 10;
  for (let i = 0; i + W <= dh.length; i++){ const s = Math.abs(dh.slice(i, i+W).reduce((a,b) => a+b, 0)); if (s < 10) cur += STEP; else { best = Math.max(best, cur); cur = 0; } }
  best = Math.max(best, cur);
  Object.assign(out, {turns:bends.length, sharp:bends.filter(b => b >= 90).length, hairpins:bends.filter(b => b >= 150).length,
    curv:Math.round(curv50() / km), straight:+(best + W*STEP).toFixed(1)});
  if (hasEle){ let g = 0, upd = 0, upe = 0; for (let i = 10; i < rs.length; i++){ const d = rs[i][2] - rs[i-10][2]; g = Math.max(g, Math.abs(d)); }
    for (let i = 1; i < rs.length; i++){ const d = rs[i][2] - rs[i-1][2]; if (d > 0){ upd += STEP; upe += d; } }
    Object.assign(out, {grade:Math.round(g), avg:upd ? +(upe / (upd*1000) * 100).toFixed(1) : 0}); }
}
console.log(JSON.stringify(out));
