'use strict';
const path = require('node:path');
const demo = require('../src/demo');
const root = path.resolve(__dirname, '..', 'demo-project');
demo.reset(root);
console.log('Demo restored: baseline page, next prompt runs TCODE-101.');
