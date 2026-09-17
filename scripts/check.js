'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
for (const dir of ['src', 'media', 'scripts', 'tests']) {
  for (const file of fs.readdirSync(path.join(__dirname, '..', dir)).filter(f => f.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '..', dir, file)], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
console.log('JavaScript syntax checks passed.');
