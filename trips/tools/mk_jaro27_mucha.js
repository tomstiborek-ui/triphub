// Jaro 2027 cover in the style of Alfons Mucha (Tom 2026-10-09): Art Nouveau poster with a great halo,
// the Jindřichův Hradec château (round Black Tower, the domed Rondel) over the Vajgar pond, a Třeboň fishpond dam
// with oaks and two roadsters, reeds and water lilies, ornamental gold frame, muted pastel and gold palette.
// The lower part is a dark ornamental panel so the hero text reads on it.
// Run: NODE_PATH=$(npm root -g) node trips/tools/mk_jaro27_mucha.js out.png
const {chromium} = require('playwright');
const W = 2400, H = 1600, CX = 1200, CY = 600, R = 500, HZ = 800; // halo centre/radius, water line
const INK = "#4A3426", GOLD = "#C9A24A", GOLD2 = "#E3C77A", CREAM = "#F3E8CF", ROSE = "#D9A79A", SAGE = "#9DB08A", TEAL = "#6F9A9A", DEEP = "#24363A";
const f = n => Math.round(n * 10) / 10;
const pol = (r, a) => [f(CX + r * Math.cos(a)), f(CY + r * Math.sin(a))];

// Halo: rings of mosaic tiles, a beaded ring and fine rays.
const tiles = (r0, r1, n, cols, off = 0) => Array.from({length: n}, (_, i) => {
  const a0 = (i + off) / n * 2 * Math.PI, a1 = (i + 1 + off) / n * 2 * Math.PI;
  const [p, q, s, t] = [pol(r1, a0), pol(r1, a1), pol(r0, a1), pol(r0, a0)];
  return `<path d="M${p} A${r1},${r1} 0 0 1 ${q} L${s} A${r0},${r0} 0 0 0 ${t} Z" fill="${cols[i % cols.length]}"/>`;
}).join("");
const beads = (r, n, rr) => Array.from({length: n}, (_, i) => { const [x, y] = pol(r, i / n * 2 * Math.PI); return `<circle cx="${x}" cy="${y}" r="${rr}"/>`; }).join("");
const rays = Array.from({length: 72}, (_, i) => { const a = i / 72 * 2 * Math.PI, [x1, y1] = pol(150, a), [x2, y2] = pol(R - 120, a); return `M${x1},${y1} L${x2},${y2}`; }).join(" ");
// Mucha's flourish: a few flowing whiplash ribbons behind the halo.
const ribbon = (x0, y0, dx, s) => {
  const ex = x0 + dx, ey = y0 - 30 * s, d = Math.sign(dx);
  // flowing S-curve that ends in a tightening spiral (the Art Nouveau "whiplash")
  let p = `M${x0},${y0} C${x0 + dx * .3},${y0 - 120 * s} ${x0 + dx * .55},${y0 + 140 * s} ${ex},${ey}`;
  // semicircles of shrinking radius, same sweep, alternate direction = a spiral
  for (let k = 0, r = 46; k < 4; k++, r *= .62) p += ` a${f(r)},${f(r)} 0 0 ${d > 0 ? 0 : 1} 0,${f(2 * r * (k % 2 ? 1 : -1))}`;
  return p;
};

// Château of Jindřichův Hradec on the halo's horizon (stylised, not surveyed).
const castle = `
  <!-- long palace wing with arcades -->
  <path d="M620,${HZ} V655 L660,610 H960 L1000,655 V${HZ} Z" fill="${CREAM}"/>
  <path d="M640,615 L660,575 H960 L985,615 Z" fill="${TEAL}"/>
  ${Array.from({length: 7}, (_, i) => `<path d="M${650 + i * 47},${HZ} V735 A18,18 0 0 1 ${686 + i * 47},735 V${HZ}" fill="${ROSE}"/>`).join("")}
  ${Array.from({length: 7}, (_, i) => `<rect x="${656 + i * 47}" y="672" width="22" height="30" rx="11" fill="${INK}" opacity=".75"/>`).join("")}
  <!-- Black Tower: tall round tower with a tented roof and lantern -->
  <rect x="1010" y="445" width="120" height="${HZ - 445}" fill="#E7D3B0"/>
  <path d="M1000,450 L1070,330 L1140,450 Z" fill="${INK}"/>
  <path d="M1058,330 V292 M1082,330 V292 M1052,292 H1088 M1070,292 V250" stroke="${INK}" stroke-width="8" fill="none"/>
  <circle cx="1070" cy="244" r="10" fill="${GOLD}"/>
  ${[520, 600, 680].map(y => `<rect x="1060" y="${y}" width="20" height="36" rx="10" fill="${INK}" opacity=".8"/>`).join("")}
  <path d="M1010,470 H1130 M1010,760 H1130" stroke="${INK}" stroke-width="6"/>
  <!-- main castle block with gables -->
  <path d="M1130,${HZ} V600 L1175,560 L1220,600 L1265,560 L1310,600 V${HZ} Z" fill="${ROSE}"/>
  <path d="M1130,600 L1175,560 L1220,600 L1265,560 L1310,600" fill="none" stroke="${INK}" stroke-width="8"/>
  ${[1150, 1195, 1240, 1285].map(x => `<rect x="${x}" y="640" width="16" height="34" rx="8" fill="${INK}" opacity=".75"/><rect x="${x}" y="712" width="16" height="34" rx="8" fill="${INK}" opacity=".75"/>`).join("")}
  <!-- Rondel: round pavilion with a dome and lantern -->
  <path d="M1360,${HZ} V665 H1600 V${HZ} Z" fill="${CREAM}"/>
  <path d="M1350,668 Q1480,470 1610,668 Z" fill="${SAGE}"/>
  <path d="M1462,572 V540 H1498 V572 Z" stroke="${INK}" stroke-width="7" fill="${GOLD2}"/><path d="M1456,542 Q1480,515 1504,542 Z M1480,520 V496" stroke="${INK}" stroke-width="7" fill="${SAGE}"/>
  <circle cx="1480" cy="490" r="9" fill="${GOLD}"/>
  ${Array.from({length: 5}, (_, i) => `<path d="M${1378 + i * 45},${HZ} V722 A16,16 0 0 1 ${1410 + i * 45},722 V${HZ}" fill="${TEAL}"/>`).join("")}
  <path d="M1350,668 Q1480,470 1610,668 M1360,690 H1600" fill="none" stroke="${INK}" stroke-width="8"/>
  <!-- church tower behind, right -->
  <rect x="1660" y="560" width="70" height="${HZ - 560}" fill="#E7D3B0"/>
  <path d="M1650,565 L1695,440 L1740,565 Z" fill="${TEAL}"/><path d="M1695,440 V405 M1683,418 H1707" stroke="${INK}" stroke-width="7"/>
  <rect x="1686" y="600" width="18" height="34" rx="9" fill="${INK}" opacity=".75"/>`;

// Pond oaks on the dam: round stylised crowns.
const oak = (x, y, r) => `<g><path d="M${x},${y} V${y - r * 1.2}" stroke="${INK}" stroke-width="12"/>
  <circle cx="${x}" cy="${y - r * 1.5}" r="${r}" fill="${SAGE}" stroke="${INK}" stroke-width="7"/>
  <circle cx="${x - r * .55}" cy="${y - r * 1.25}" r="${r * .62}" fill="#8BA079" stroke="${INK}" stroke-width="6"/>
  <circle cx="${x + r * .5}" cy="${y - r * 1.2}" r="${r * .58}" fill="#AFC09A" stroke="${INK}" stroke-width="6"/></g>`;
// Small roadster in profile (driving right), outlined like a poster.
const roadster = (x, y, s, body) => `<g transform="translate(${x},${y}) scale(${s})" stroke="${INK}" stroke-width="${7 / s}" stroke-linejoin="round">
  <path d="M0,0 L10,-28 Q70,-44 150,-44 L170,-62 Q190,-70 214,-62 L232,-44 Q300,-42 330,-26 L340,0 Z" fill="${body}"/>
  <path d="M174,-58 L196,-82 L206,-80 L196,-58" fill="${GOLD2}"/>
  <circle cx="70" cy="2" r="24" fill="${INK}"/><circle cx="70" cy="2" r="9" fill="${GOLD}"/>
  <circle cx="270" cy="2" r="24" fill="${INK}"/><circle cx="270" cy="2" r="9" fill="${GOLD}"/></g>`;

// Reeds and cattails for the side panels, and water lilies on the pond.
const reed = (x, y, h, lean, w = 16) => `<path d="M${x},${y} C${x + lean * .3},${y - h * .4} ${x + lean * .7},${y - h * .7} ${x + lean},${y - h} C${x + lean * .7 - w},${y - h * .7} ${x + lean * .3 - w},${y - h * .4} ${x - w},${y} Z"/>`;
const cattail = (x, y, h, lean) => `<path d="M${x},${y} Q${x + lean * .5},${y - h * .5} ${x + lean},${y - h}" fill="none" stroke="${INK}" stroke-width="6"/><rect x="${x + lean - 9}" y="${y - h - 10}" width="18" height="70" rx="9" fill="#8A5A3B" stroke="${INK}" stroke-width="5" transform="rotate(${lean / 12} ${x + lean} ${y - h})"/>`;
const lily = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" stroke="${INK}" stroke-width="${5 / s}">
  <path d="M0,6 L86,-2 A90,28 0 1 0 86,14 Z" fill="${SAGE}"/><path d="M0,6 L-60,-8 M0,6 L-70,18 M0,6 L20,30" stroke="${INK}" stroke-width="${3 / s}" fill="none" opacity=".6"/>
  ${[-66, -33, 0, 33, 66, -16, 16].map((a, i) => `<ellipse cx="0" cy="-30" rx="12" ry="32" fill="${i > 4 ? CREAM : "#F1D9D2"}" transform="rotate(${a})"/>`).join("")}
  <circle cx="0" cy="-12" r="9" fill="${GOLD}"/></g>`;

// Frame: gold double lines, side panels with reeds, corner medallions.
const PAD = 46, SIDE = 190;
const sidePanel = (x0, dir) => {
  const cx = x0 + SIDE / 2;
  return `<rect x="${x0}" y="${PAD}" width="${SIDE}" height="${H - 2 * PAD}" fill="#E9DBBB"/>
  <g stroke="${INK}" stroke-width="5">${[0, 1, 2, 3, 4, 5].map(i => `<g fill="${i % 2 ? SAGE : "#8BA079"}">${reed(cx - 70 + i * 26, 1160, 640 + (i * 97 % 300), dir * (20 + (i * 37 % 90)) * (i % 3 ? 1 : -1), 26)}</g>`).join("")}</g>
  ${[[cx - 10, 640, 470, -1], [cx + 20, 860, 300, 1]].map(([x, y, h, side]) => `<path d="M${x},1160 C${x + side * 30},${y + 200} ${x - side * 20},${y + 80} ${x},${y}" fill="none" stroke="${INK}" stroke-width="6"/>
    <g transform="translate(${x},${y})" stroke="${INK}" stroke-width="5"><path d="M0,0 C-40,-20 -60,-70 -44,-96 C-26,-70 -14,-40 0,0 Z" fill="${CREAM}"/><path d="M0,0 C40,-20 60,-70 44,-96 C26,-70 14,-40 0,0 Z" fill="${CREAM}"/><path d="M0,0 C-16,-40 -10,-90 0,-110 C10,-90 16,-40 0,0 Z" fill="#FBF3E2"/><path d="M0,-10 V-60 M-8,-58 h16" stroke="${GOLD}" stroke-width="5"/></g>`).join("")}
  ${cattail(cx - 30, 1160, 640, dir * 30)}${cattail(cx + 30, 1160, 560, dir * 55)}
  ${[260, 520].map(y => `<circle cx="${cx}" cy="${y}" r="44" fill="${CREAM}" stroke="${GOLD}" stroke-width="8"/><circle cx="${cx}" cy="${y}" r="20" fill="${ROSE}" stroke="${INK}" stroke-width="5"/>`).join("")}
  <path d="M${x0 + 18},${PAD + 18} V${H - PAD - 18} M${x0 + SIDE - 18},${PAD + 18} V${H - PAD - 18}" stroke="${GOLD}" stroke-width="5"/>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9D2C2"/><stop offset=".55" stop-color="#F3E3C6"/><stop offset="1" stop-color="#F6EAD2"/></linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DBDB6"/><stop offset=".35" stop-color="${TEAL}"/><stop offset="1" stop-color="#3F5E5F"/></linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E4245"/><stop offset="1" stop-color="#1C2A2C"/></linearGradient>
  <clipPath id="halo"><circle cx="${CX}" cy="${CY}" r="${R - 70}"/></clipPath>
  <clipPath id="below"><rect x="0" y="${HZ}" width="${W}" height="${H}"/></clipPath>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .29  0 0 0 0 .2  0 0 0 0 .15  0 0 0 .16 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="wob"><feTurbulence type="turbulence" baseFrequency=".004 .06" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<!-- flowing ribbons behind the halo -->
<g fill="none" stroke="${GOLD2}" stroke-width="16" stroke-linecap="round" opacity=".75">
  <path d="${ribbon(860, 330, -560, 1)}"/><path d="${ribbon(800, 450, -470, -.8)}"/><path d="${ribbon(1540, 330, 560, 1)}"/><path d="${ribbon(1600, 450, 470, -.8)}"/>
</g>
<g fill="none" stroke="${ROSE}" stroke-width="8" stroke-linecap="round" opacity=".8">
  <path d="${ribbon(830, 390, -520, .6)}"/><path d="${ribbon(1570, 390, 520, .6)}"/>
</g>
<g fill="${CREAM}" stroke="${INK}" stroke-width="6">
  ${[[420, 190, 1], [1980, 210, -1], [560, 520, -1], [1840, 540, 1]].map(([x, y, d]) => `<path d="M${x - 150},${y + 40} ${[0, 1, 2, 3, 4].map(i => `a${36 + (i % 2) * 14},${36 + (i % 2) * 14} 0 0 1 ${60},0`).join(" ")} Q${x + 190},${y + 40} ${x + 175},${y + 64} H${x - 165} Q${x - 175},${y + 46} ${x - 150},${y + 40} Z" transform="scale(${d},1)" transform-origin="${x} ${y}"/>`).join("")}
</g>
<!-- halo -->
<circle cx="${CX}" cy="${CY}" r="${R}" fill="${GOLD}" stroke="${INK}" stroke-width="8"/>
<g stroke="${INK}" stroke-width="3">${tiles(R - 62, R - 8, 48, [GOLD2, "#B88F3E", CREAM, "#D9B76E"])}</g>
<g fill="${CREAM}" stroke="${INK}" stroke-width="3">${beads(R - 78, 64, 8)}</g>
<g fill="${ROSE}" stroke="${INK}" stroke-width="3">${Array.from({length: 48}, (_, i) => { const [x, y] = pol(R - 35, (i + .5) / 48 * 2 * Math.PI); return i % 2 ? `<circle cx="${x}" cy="${y}" r="9"/>` : `<circle cx="${x}" cy="${y}" r="5" fill="${INK}"/>`; }).join("")}</g>
<g clip-path="url(#halo)">
  <rect x="0" y="0" width="${W}" height="${HZ}" fill="#F1E1C4"/>
  <path d="${rays}" stroke="${GOLD2}" stroke-width="4" opacity=".7"/>
  <circle cx="${CX}" cy="${CY}" r="150" fill="#F6E9CF" stroke="${GOLD}" stroke-width="6"/>
  <circle cx="${CX}" cy="${CY}" r="112" fill="none" stroke="${ROSE}" stroke-width="5" stroke-dasharray="6 14"/>
</g>
<circle cx="${CX}" cy="${CY}" r="${R - 70}" fill="none" stroke="${INK}" stroke-width="7"/>
<!-- château on the horizon and its reflection in the Vajgar -->
<g stroke="${INK}" stroke-width="7" stroke-linejoin="round">${castle}</g>
<rect x="0" y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#water)"/>
<g clip-path="url(#below)" opacity=".38" filter="url(#wob)"><g transform="translate(0,${2 * HZ}) scale(1,-1)" stroke="${INK}" stroke-width="5">${castle}</g></g>
<g fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round" opacity=".55">
  ${[835, 870, 905].map((y, i) => `<path d="M${560 + i * 40},${y} q60,-14 120,0 t120,0 t120,0 M${1360 - i * 30},${y + 10} q60,-14 120,0 t120,0 t120,0"/>`).join("")}
</g>
<path d="M0,${HZ} H${W}" stroke="${INK}" stroke-width="8"/>
<!-- Třeboň fishpond dam with oaks and the group's roadsters -->
<path d="M0,1000 C500,955 1900,950 ${W},990 L${W},1040 C1900,1000 500,1005 0,1050 Z" fill="#B7A27A" stroke="${INK}" stroke-width="8"/>
${oak(330, 985, 70)}${oak(560, 972, 82)}${oak(1930, 975, 80)}${oak(2130, 985, 66)}
${roadster(860, 975, 1.05, "#B5524A")}${roadster(1270, 972, 1.0, "#5F7E9A")}
<path d="M0,1050 C500,1005 1900,1000 ${W},1040" fill="none" stroke="${GOLD2}" stroke-width="5" opacity=".8"/>
<!-- water lilies -->
${lily(470, 1105, 1)}${lily(700, 1150, .75)}${lily(1760, 1110, .95)}${lily(1980, 1150, .7)}
<!-- dark ornamental panel for the hero text -->
<path d="M0,1180 C600,1150 1800,1150 ${W},1180 V${H} H0 Z" fill="url(#panel)"/>
<path d="M0,1180 C600,1150 1800,1150 ${W},1180" fill="none" stroke="${GOLD}" stroke-width="10"/>
<g fill="none" stroke="${GOLD}" stroke-width="5" stroke-linecap="round" opacity=".55">
  ${Array.from({length: 9}, (_, i) => { const x = 240 + i * 240; return `<path d="M${x},1250 c40,-30 80,30 120,0 s80,30 120,0"/><circle cx="${x + 120}" cy="1300" r="10"/><path d="M${x + 60},1300 q60,-40 120,0" opacity=".7"/>`; }).join("")}
  ${Array.from({length: 18}, (_, i) => { const x = 270 + i * 110; return `<path d="M${x},1500 c20,-60 60,-60 80,0 M${x + 40},1500 v-34"/>`; }).join("")}
  <path d="M${PAD + SIDE + 30},1520 H${W - PAD - SIDE - 30}"/>
  <path d="M${PAD + SIDE + 30},1340 H${W - PAD - SIDE - 30}"/>
</g>
${sidePanel(PAD, 1)}${sidePanel(W - PAD - SIDE, -1)}
<!-- top band: mosaic arch -->
<rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="70" fill="#E9DBBB"/>
<g stroke="${INK}" stroke-width="3">${Array.from({length: 40}, (_, i) => `<rect x="${PAD + 12 + i * ((W - 2 * PAD - 24) / 40)}" y="${PAD + 14}" width="${(W - 2 * PAD - 24) / 40 - 6}" height="42" rx="6" fill="${[GOLD2, ROSE, SAGE, CREAM][i % 4]}"/>`).join("")}</g>
<!-- outer frame -->
<rect x="${PAD / 2}" y="${PAD / 2}" width="${W - PAD}" height="${H - PAD}" fill="none" stroke="${GOLD}" stroke-width="${PAD - 6}"/>
<rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}" fill="none" stroke="${INK}" stroke-width="8"/>
<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${INK}" stroke-width="6"/>
${[[PAD, PAD], [W - PAD, PAD], [PAD, H - PAD], [W - PAD, H - PAD]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="34" fill="${CREAM}" stroke="${INK}" stroke-width="7"/><circle cx="${x}" cy="${y}" r="15" fill="${GOLD}" stroke="${INK}" stroke-width="4"/>`).join("")}
<rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({viewport: {width: W, height: H}});
  await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await pg.screenshot({path: process.argv[2] || "jaro27-mucha.png"});
  await b.close();
})();
