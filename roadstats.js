// Sypačky: everything we show about a road, worked out from its GPX (Tom 2026-10-14/15, in-browser since 2026-11-04).
// Used by index.html (people add roads from a GPX on the site) and by trips/tools/mk_road.js (Node).
// gpxPoints(xml) -> [[lon,lat,ele|null],…]; roadStats(points) -> {km, line, climb, min, max, prof, turns, sharp, hairpins, curv, straight, grade, avg}.
(function(root){
  // Track points when the file has a track; route points (<rtept>) only when it has nothing else, because a route
  // often holds just its start, via points and end, and mixing them with the track draws lines across the map.
  function gpxPoints(x){
    const pts = tag => [...String(x).matchAll(new RegExp(`<(?:\\w+:)?${tag}\\b([^>]*)>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>|<(?:\\w+:)?${tag}\\b([^>]*)\\/>`, "g"))].map(m => {
      const at = m[1] || m[3] || "", lat = /\blat\s*=\s*["']([-\d.eE+]+)/.exec(at), lon = /\blon\s*=\s*["']([-\d.eE+]+)/.exec(at), ele = /<(?:\w+:)?ele>\s*([-\d.eE+]+)/.exec(m[2] || "");
      return lat && lon && isFinite(+lat[1]) && isFinite(+lon[1]) ? [+lon[1], +lat[1], ele && isFinite(+ele[1]) ? +ele[1] : null] : null;
    }).filter(Boolean);
    const trk = pts("trkpt"); return trk.length >= 2 ? trk : pts("rtept");
  }
  // True when the points are too sparse to be the road itself (e.g. only a route's start and end): over 300 m per point on average.
  function gpxSparse(P){ if (P.length < 2) return true; let d = 0; for (let i = 1; i < P.length; i++) d += Math.hypot((P[i][0]-P[i-1][0]) * Math.cos(P[i][1]*Math.PI/180), P[i][1]-P[i-1][1]) * 111.32; return d / (P.length - 1) > 0.3; }
  // The GPX's own name: Mapy.com writes "Route from A to B"; returns {name, from, to} where it can tell.
  function gpxNames(x){
    const nm = /<(?:\w+:)?(?:trk|rte)>\s*<(?:\w+:)?name>([^<]*)<\/(?:\w+:)?name>/.exec(String(x)) || /<(?:\w+:)?name>([^<]*)<\/(?:\w+:)?name>/.exec(String(x));
    const name = nm ? nm[1].replace(/&amp;/g, "&").trim() : "", r = /^Route from (.+) to (.+)$/i.exec(name);
    const place = s => /^[\d.]+[NS],\s*[\d.]+[EW]$/.test(s.trim()) ? "" : s.replace(/\s*\(\d+\s*m\)\s*$/, "").trim();
    return r ? {name:"", from:place(r[1]), to:place(r[2])} : {name, from:"", to:""};
  }
  function roadStats(P){
    if (P.length < 2) throw new Error("no track points");
    const R = 6371, dist = [0];
    for (let i = 1; i < P.length; i++){ const a = P[i-1], b = P[i], dl = (b[1]-a[1])*Math.PI/180, dn = (b[0]-a[0])*Math.PI/180;
      const h = Math.sin(dl/2)**2 + Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.sin(dn/2)**2; dist.push(dist[i-1] + 2*R*Math.asin(Math.sqrt(h))); }
    const km = dist[dist.length-1], hasEle = P.some(p => p[2] != null), e = P.map(p => p[2] ?? 0);
    if (!(km > 0.05)) throw new Error("too short");
    let up = 0; for (let i = 1; i < P.length; i++){ const d = e[i] - e[i-1]; if (d > 0) up += d; }
    const prof = []; let j = 0; for (let k = 0; k <= 60; k++){ const t = km*k/60; while (j < P.length-1 && dist[j+1] < t) j++; prof.push(Math.round(e[j])); }
    // Douglas-Peucker in 4 chunks (a whole loop whose start equals its end would otherwise collapse), up to ~400 points.
    function dp(pts, eps){ if (pts.length < 3) return pts; let mx = 0, ix = 0; const a = pts[0], b = pts[pts.length-1];
      for (let i = 1; i < pts.length-1; i++){ const p = pts[i], dx = b[0]-a[0], dy = b[1]-a[1]; const d = Math.abs(dy*p[0] - dx*p[1] + b[0]*a[1] - b[1]*a[0]) / (Math.hypot(dx, dy) || 1e-12); if (d > mx){ mx = d; ix = i; } }
      return mx > eps ? [...dp(pts.slice(0, ix+1), eps).slice(0, -1), ...dp(pts.slice(ix), eps)] : [a, b]; }
    const chunks = 4, size = Math.ceil(P.length / chunks);
    let eps = 0.00008, line;
    for (;;){ line = []; for (let c = 0; c < chunks; c++){ const part = P.slice(c*size, Math.min(P.length, (c+1)*size + 1)); if (part.length) line.push(...(c ? dp(part, eps).slice(1) : dp(part, eps))); } if (line.length <= 400) break; eps *= 1.3; }
    const out = {km:+km.toFixed(1), line:line.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)])};
    if (hasEle) Object.assign(out, {climb:Math.round(up), min:Math.round(Math.min(...e)), max:Math.round(Math.max(...e)), prof});
    // Geometry: resample every 10 m and follow the heading. A bend is a run of turning (>2.5° per 10 m, a radius under ~230 m)
    // in one direction that adds up to 30°+. Straights are stretches with under 10° of turning per 100 m.
    const STEP = 0.01, rs = []; let k = 0;
    for (let t = 0; t <= km; t += STEP){ while (k < P.length-2 && dist[k+1] < t) k++; const f = (t - dist[k]) / ((dist[k+1] - dist[k]) || 1e-9);
      rs.push([P[k][0] + (P[k+1][0]-P[k][0])*f, P[k][1] + (P[k+1][1]-P[k][1])*f, e[k] + (e[k+1]-e[k])*f]); }
    const cl = Math.cos(P[0][1]*Math.PI/180), hd = [];
    for (let i = 1; i < rs.length; i++) hd.push(Math.atan2((rs[i][0]-rs[i-1][0])*cl, rs[i][1]-rs[i-1][1]) * 180/Math.PI);
    const dh = []; for (let i = 1; i < hd.length; i++){ let d = hd[i] - hd[i-1]; d = ((d + 540) % 360) - 180; dh.push(d); }
    const sm = dh.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i-1); j <= Math.min(dh.length-1, i+1); j++){ s += dh[j]; n++; } return s / n; });
    // Turning per km on a 50 m grid, so GPX jitter on straights doesn't count as turning.
    let turned = 0; for (let i = 10; i < rs.length; i += 5){ const h1 = Math.atan2((rs[i-5][0]-rs[i-10][0])*cl, rs[i-5][1]-rs[i-10][1]), h2 = Math.atan2((rs[i][0]-rs[i-5][0])*cl, rs[i][1]-rs[i-5][1]);
      let d = (h2 - h1) * 180/Math.PI; d = ((d + 540) % 360) - 180; turned += Math.abs(d); }
    const bends = []; let run = 0, sign = 0;
    for (const d of sm){ const sg = Math.sign(d);
      if (Math.abs(d) > 2.5 && (sg === sign || !sign)){ run += d; sign = sg; }
      else { if (Math.abs(run) >= 30) bends.push(Math.abs(run)); run = Math.abs(d) > 2.5 ? d : 0; sign = Math.abs(d) > 2.5 ? sg : 0; } }
    if (Math.abs(run) >= 30) bends.push(Math.abs(run));
    let best = 0, cur = 0; const W = 10;
    for (let i = 0; i + W <= dh.length; i++){ let s = 0; for (let q = i; q < i+W; q++) s += dh[q]; if (Math.abs(s) < 10) cur += STEP; else { best = Math.max(best, cur); cur = 0; } }
    best = Math.max(best, cur);
    Object.assign(out, {turns:bends.length, sharp:bends.filter(b => b >= 90).length, hairpins:bends.filter(b => b >= 150).length,
      curv:Math.round(turned / km), straight:+(best + W*STEP).toFixed(1)});
    if (hasEle){ let g = 0, upd = 0, upe = 0; for (let i = 10; i < rs.length; i++){ const d = rs[i][2] - rs[i-10][2]; g = Math.max(g, Math.abs(d)); }
      for (let i = 1; i < rs.length; i++){ const d = rs[i][2] - rs[i-1][2]; if (d > 0){ upd += STEP; upe += d; } }
      Object.assign(out, {grade:Math.round(g), avg:upd ? +(upe / (upd*1000) * 100).toFixed(1) : 0}); }
    return out;
  }
  const api = {gpxPoints, gpxNames, gpxSparse, roadStats};
  if (typeof module === "object" && module.exports) module.exports = api; else Object.assign(root, api);
})(typeof window !== "undefined" ? window : this);
