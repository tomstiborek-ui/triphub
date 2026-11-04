// Sypačky (Tom 2026-10-14): turn one road GPX into a ROADS entry for index.html.
// Run: node trips/tools/mk_road.js road.gpx id "Name" > entry.json   (prints {id,n,km,line,climb,min,max,prof,turns,sharp,hairpins,curv,straight,grade,avg})
// The maths lives in roadstats.js, shared with the "Přidat sypačku" form on the site (2026-11-04).
const fs = require('fs'), path = require('path');
const {gpxPoints, roadStats} = require(path.join(__dirname, '..', '..', 'roadstats.js'));
const [file, id = "road", n = ""] = process.argv.slice(2);
console.log(JSON.stringify({id, n, ...roadStats(gpxPoints(fs.readFileSync(file, 'utf8')))}));
