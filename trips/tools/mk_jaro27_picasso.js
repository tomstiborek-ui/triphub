// Jaro 2027 cover in a cubist, Picasso-like style (Tom 2026-10-06): faceted background, the Praděd tower,
// sun and a roadster broken into planes seen from several sides, thick black lines, muted cubist palette.
// The lower part is dark so the hero text reads on it. Run: NODE_PATH=$(npm root -g) node trips/tools/mk_jaro27_picasso.js out.png
const {chromium} = require('playwright');
const W = 2400, H = 1600;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const SKY = ["#5B7FA3","#7FA0B8","#E6D3A3","#3E5F80","#A9B9B9","#D9B76E"];
const LAND = ["#C8963E","#A0522D","#B97A3A","#7D5A3A","#D9B76E","#6E7F5C"];
const LOW = ["#2B2622","#3A2F28","#24282C","#33302B","#2E2A2F"];
const UP = 150, RUP = 60; // car and road sit higher so the hero title doesn't cover them
const ridge = x => 650 - RUP - 200 * Math.exp(-(((x - 1200) / 380) ** 2)) - 45 * Math.sin(x / 230) - 25 * Math.cos(x / 97);
// Jittered grid → triangles, coloured by where their centre falls.
const cols = 10, rows = 7, P = [];
for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
  const edge = i === 0 || j === 0 || i === cols || j === rows;
  P.push([i * W / cols + (edge ? 0 : (rnd() - .5) * 190), j * H / rows + (edge ? 0 : (rnd() - .5) * 160)]);
}
const tris = [];
for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
  const a = P[j * (cols + 1) + i], b = P[j * (cols + 1) + i + 1], c = P[(j + 1) * (cols + 1) + i], d = P[(j + 1) * (cols + 1) + i + 1];
  if (rnd() < .5) tris.push([a, b, d], [a, d, c]); else tris.push([a, b, c], [b, d, c]);
}
const pick = a => a[Math.floor(rnd() * a.length)];
const facets = tris.map(t => {
  const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
  const col = cy > 880 - UP ? pick(LOW) : cy < ridge(cx) ? pick(SKY) : pick(LAND);
  return `<polygon points="${t.map(p => p.map(Math.round).join(",")).join(" ")}" fill="${col}"/>`;
}).join("");
const ridgePts = []; for (let x = -40; x <= W + 40; x += 120) ridgePts.push([x, Math.round(ridge(x) + (rnd() - .5) * 50)]);
const mountain = `M${ridgePts.map(p => p.join(",")).join(" L")} L${W + 40},${900 - UP} L-40,${900 - UP} Z`;
// Tower on the summit, split into two halves seen from slightly different heights.
const tx = 1200, ty = ridge(1200) - 10;
const tower = `M${tx - 48},${ty} L${tx - 22},${ty - 180} L${tx - 28},${ty - 180} L${tx - 28},${ty - 205} L${tx + 28},${ty - 205} L${tx + 28},${ty - 180} L${tx + 22},${ty - 180} L${tx + 48},${ty} Z M${tx - 54},${ty - 160} h108 v56 h-108 Z M${tx - 6},${ty - 258} h12 v53 h-12 Z`;
// Roadster in profile, front and rear halves shifted (two viewpoints), with a frontal "eye" headlight.
const car = "M760,830 L790,782 Q880,760 1030,756 L1110,752 Q1150,700 1210,694 L1260,694 L1290,748 Q1430,756 1560,778 L1590,812 L1590,850 L760,850 Z";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <clipPath id="L"><rect x="0" y="0" width="${tx}" height="${H}"/></clipPath><clipPath id="R"><rect x="${tx}" y="0" width="${W}" height="${H}"/></clipPath>
  <clipPath id="CF"><rect x="1175" y="0" width="${W}" height="${H}"/></clipPath><clipPath id="CB"><rect x="0" y="0" width="1175" height="${H}"/></clipPath>
  ${[0,1,2,3].map(q => `<clipPath id="S${q}"><rect x="${q%2 ? 1700 : 1500}" y="${q<2 ? 150 : 330}" width="200" height="180"/></clipPath>`).join("")}
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0,0 V16" stroke="#1d1a17" stroke-width="3" opacity=".35"/></pattern>
</defs>
<g stroke="#1d1a17" stroke-width="3" stroke-linejoin="round">${facets}</g>
<path d="${mountain}" fill="#B97A3A" opacity=".55"/>
<path d="${mountain}" fill="url(#hatch)" opacity=".6" clip-path="url(#R)"/>
<path d="${mountain}" fill="none" stroke="#111" stroke-width="12" stroke-linejoin="round"/>
${["#E6D3A3","#C0392B","#3E5F80","#D9B76E"].map((c,q) => `<g clip-path="url(#S${q})"><circle cx="${1700 + (q%2?16:-12)}" cy="${330 + (q<2?-14:12)}" r="140" fill="${c}" stroke="#111" stroke-width="12"/></g>`).join("")}
<path d="M1540,330 H1860 M1700,170 V490" stroke="#111" stroke-width="8"/>
<g clip-path="url(#L)"><path d="${tower}" fill="#F2E6C4" stroke="#111" stroke-width="10" stroke-linejoin="round"/></g>
<g clip-path="url(#R)" transform="translate(10,-34)"><path d="${tower}" fill="#C0392B" stroke="#111" stroke-width="10" stroke-linejoin="round"/></g>
<g transform="translate(0,-${UP})">
<g clip-path="url(#CB)"><path d="${car}" fill="#C0392B" stroke="#111" stroke-width="12" stroke-linejoin="round"/></g>
<g clip-path="url(#CF)" transform="translate(0,-26)"><path d="${car}" fill="#D9B76E" stroke="#111" stroke-width="12" stroke-linejoin="round"/>
  <path d="M1110,752 Q1150,700 1210,694 L1260,694 L1290,748" fill="#7FA0B8" stroke="#111" stroke-width="9"/></g>
<path d="M1175,640 V900" stroke="#111" stroke-width="10"/>
<g stroke="#111" stroke-width="10"><ellipse cx="1480" cy="760" rx="62" ry="34" fill="#F2E6C4"/><circle cx="1480" cy="760" r="20" fill="#111"/></g>
<circle cx="930" cy="858" r="66" fill="#2B2622" stroke="#111" stroke-width="12"/><circle cx="930" cy="858" r="24" fill="#E6D3A3"/>
<rect x="1338" y="800" width="122" height="122" fill="#2B2622" stroke="#111" stroke-width="12" transform="rotate(14 1399 861)"/><rect x="1380" y="842" width="38" height="38" fill="#D9B76E" transform="rotate(14 1399 861)"/>
<path d="M0,930 L${W},905" stroke="#111" stroke-width="10"/>
<path d="M0,960 L${W},935" stroke="#E6D3A3" stroke-width="12" stroke-dasharray="110 70" opacity=".8"/>
</g>
<rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({viewport: {width: W, height: H}});
  await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await pg.screenshot({path: process.argv[2] || "jaro27-picasso.png"});
  await b.close();
})();
