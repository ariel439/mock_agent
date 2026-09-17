'use strict';
const path = require('node:path');
const demo = require('../src/demo');
const root = path.resolve(__dirname, '..', 'demo-project');
demo.reset(root);
console.log('Demonstração restaurada: página inicial do café; a próxima mensagem executa TCODE-101.');
