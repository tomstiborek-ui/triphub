// Preview of a new look (Tom 2026-11-01): builds preview.html = index.html + preview/apple.css + a small "Náhled" badge.
// Run from the repo root after changing index.html or preview/apple.css: node trips/tools/mk_preview.js
const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');
const i = s.indexOf('</style>', s.indexOf('<style>\n:root{'));
if (i < 0) throw new Error("main <style> block not found");
s = s.slice(0, i + 8) + '\n<link rel="stylesheet" href="preview/apple.css">' + s.slice(i + 8);
s = s.replace('<title>Trip Hub</title>', '<title>Trip Hub – náhled</title>');
s = s.replace(/<\/body>(?![\s\S]*<\/body>)/, '<div class="preview-badge" role="note">Náhled nového vzhledu <a href="./">Současný web</a></div>\n</body>');
fs.writeFileSync('preview.html', s);
console.log('preview.html written,', s.length, 'bytes');
