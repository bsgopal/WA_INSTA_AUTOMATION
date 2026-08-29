const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(e.name)) files.push(p);
  }
})(srcDir);

const hexRe = /#([0-9a-fA-F]{3,8})\b/g;
const counts = new Map();
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  for (const m of content.matchAll(hexRe)) {
    const h = '#' + m[1].toLowerCase();
    counts.set(h, (counts.get(h) || 0) + 1);
  }
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
console.log('unique hex:', sorted.length, 'total:', [...counts.values()].reduce((a, b) => a + b, 0));
for (const [h, c] of sorted) console.log(`${h} ${c}`);