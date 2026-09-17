'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const file of ['README.md', 'tickets/TCODE-101.md', 'tickets/TCODE-102.md']) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const link = match[1].split('#')[0];
    if (link && !/^https?:/.test(link) && !fs.existsSync(path.resolve(root, path.dirname(file), link))) throw new Error(`Broken link in ${file}: ${link}`);
  }
}
console.log('Documentation links passed.');
