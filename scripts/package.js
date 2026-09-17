'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createVSIX } = require('@vscode/vsce');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
const version = require('../package.json').version;
createVSIX({ cwd: root, packagePath: path.join(root, 'artifacts', `t-code-${version}.vsix`), dependencies: false, allowMissingRepository: true, rewriteRelativeLinks: false })
  .catch(error => { console.error(error); process.exitCode = 1; });
