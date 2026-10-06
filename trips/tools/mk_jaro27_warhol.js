// Jaro 2027 cover in an Andy Warhol pop-art style (Tom 2026-10-06): 3x2 grid of the same motif
// (Praděd tower over Jeseníky + a roadster) in clashing flat colours, misregistered fills, halftone dots.
// One row of three tall panels so the hero text sits on the dark road, not on another row of motifs.
// Run: NODE_PATH=$(npm root -g) node trips/tools/mk_jaro27_warhol.js out.png  (then convert to JPG)
const {chromium} = require('playwright');
const W = 800, H = 1600, COLS = 3, ROWS = 1; // tall panels: motif on top, asphalt below sits behind the hero text
const PAL = [ // sky, dots, sun, mountain, tower, car, road
  ["#FF4FA3","#C2185B","#FFE600","#00B3E6","#FFFFFF","#FFE600","#1B1B1B"],
  ["#FFE600","#F2A900","#FF3D2E","#7A3CFF","#00E0C6","#FF4FA3","#1B1B1B"],
  ["#00C2FF","#0077B6","#FF8A00","#FF2E88","#FFE600","#B6FF00","#1B1B1B"],
  ["#B6FF00","#5FA800","#FF2E88","#FF8A00","#7A3CFF","#00C2FF","#1B1B1B"],
  ["#7A3CFF","#4B1FB0","#B6FF00","#FFE600","#FF4FA3","#FF3D2E","#1B1B1B"],
  ["#FF8A00","#D35400","#00E0C6","#2D2DFF","#FFFFFF","#FFE600","#1B1B1B"],
];
const mountain = "M-20,560 L120,430 L210,470 L330,330 L400,300 L470,330 L590,450 L680,410 L820,520 L820,820 L-20,820 Z";
const tower = "M384,318 L392,150 L388,150 L388,128 L412,128 L412,150 L408,150 L416,318 Z M380,186 h40 v34 h-40 Z M398,60 h4 v68 h-4 Z";
const car = "M190,640 L204,612 Q250,600 330,597 L380,595 Q405,566 440,563 L470,563 L486,592 Q560,596 612,610 L626,628 L626,652 L190,652 Z";
const panel = (p, i) => {
  const [sky, dots, sun, mnt, tw, cr, road] = p, ox = 9, oy = 7, id = "d" + i;
  return `<g transform="translate(${(i % COLS) * W},${Math.floor(i / COLS) * H})">
    <defs><pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="5.4" fill="${dots}"/></pattern>
    <clipPath id="c${i}"><rect width="${W}" height="${H}"/></clipPath></defs>
    <g clip-path="url(#c${i})">
    <rect width="${W}" height="${H}" fill="${sky}"/>
    <rect width="${W}" height="${H}" fill="url(#${id})" opacity=".55"/>
    <circle cx="${600 + ox}" cy="${170 + oy}" r="92" fill="${sun}"/>
    <path d="${mountain}" fill="${mnt}" transform="translate(${ox},${oy})"/>
    <path d="${mountain}" fill="url(#${id})" opacity=".35" transform="translate(${ox},${oy})"/>
    <path d="${tower}" fill="${tw}" transform="translate(${ox},${oy})"/>
    <rect x="-20" y="${662 + oy}" width="${W + 40}" height="${H}" fill="${road}"/>
    <rect x="0" y="${760 + oy}" width="${W}" height="${H}" fill="url(#${id})" opacity=".12"/>
    <path d="M0,${720 + oy} H${W}" stroke="#fff" stroke-width="10" stroke-dasharray="60 40"/>
    <path d="${car}" fill="${cr}" transform="translate(${ox},${oy})"/>
    <g fill="none" stroke="#111" stroke-width="7" stroke-linejoin="round">
      <circle cx="600" cy="170" r="92"/><path d="${mountain}"/><path d="${tower}"/><path d="${car}"/>
      <path d="M392,600 Q410,575 440,572 L466,572 L478,596" stroke-width="5"/>
    </g>
    <g fill="#111"><circle cx="270" cy="652" r="34"/><circle cx="540" cy="652" r="34"/></g>
    <g fill="${sun}"><circle cx="270" cy="652" r="13"/><circle cx="540" cy="652" r="13"/></g>
    </g></g>`;
};
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * COLS}" height="${H * ROWS}">${PAL.slice(0, COLS * ROWS).map(panel).join("")}
  <g stroke="#111" stroke-width="10">${[1, 2].map(c => `<path d="M${c * W},0 V${H * ROWS}"/>`).join("")}</g></svg>`;
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({viewport: {width: W * COLS, height: H * ROWS}});
  await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await pg.screenshot({path: process.argv[2] || "jaro27-warhol.png"});
  await b.close();
})();
