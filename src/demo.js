'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { snapshot, tickets } = require('./scenario');
const marker = '.t-code-demo.json';
const files = ['index.html', 'styles.css', 'app.js'];

function validateRoot(root) {
  if (fs.lstatSync(root).isSymbolicLink() || !fs.statSync(root).isDirectory()) throw new Error('Use a regular demo directory.');
  for (const name of [...files, marker]) {
    const target = path.join(root, name);
    let stat;
    try { stat = fs.lstatSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw new Error(`Unsafe demo file: ${name}`);
  }
}
function readStage(root) {
  validateRoot(root);
  const data = JSON.parse(fs.readFileSync(path.join(root, marker), 'utf8'));
  if (data.demo !== 't-code-service-hub' || data.version !== 1 || ![0, 1, 2].includes(data.stage)) throw new Error('This folder is not a recognized T-Code demo.');
  return data.stage;
}
function writeStage(root, stage) {
  const content = { ...snapshot(stage), [marker]: JSON.stringify({ demo: 't-code-service-hub', version: 1, stage }, null, 2) + '\n' };
  const backups = {};
  for (const name of Object.keys(content)) backups[name] = fs.existsSync(path.join(root, name)) ? fs.readFileSync(path.join(root, name)) : null;
  try {
    for (const [name, value] of Object.entries(content)) fs.writeFileSync(path.join(root, name), value);
  } catch (error) {
    for (const [name, value] of Object.entries(backups)) {
      if (value === null) fs.rmSync(path.join(root, name), { force: true });
      else fs.writeFileSync(path.join(root, name), value);
    }
    throw error;
  }
}
function initialize(root) {
  fs.mkdirSync(root, { recursive: true });
  validateRoot(root);
  if (fs.readdirSync(root).length) throw new Error('Initialize requires an empty folder.');
  writeStage(root, 0);
}
function advance(root) {
  const stage = readStage(root);
  if (stage === 2) throw new Error('Both tickets are complete. Reset the demo to present again.');
  const before = snapshot(stage);
  for (const name of files) {
    if (fs.readFileSync(path.join(root, name), 'utf8') !== before[name]) throw new Error(`${name} has manual changes. Save a copy, then reset the demo before continuing.`);
  }
  writeStage(root, stage + 1);
  return { stage: stage + 1, ticket: tickets[stage], before, after: snapshot(stage + 1) };
}
function reset(root) { readStage(root); writeStage(root, 0); }
function findRoot(workspaces) {
  const found = new Set();
  for (const root of workspaces) {
    for (const candidate of [root, path.join(root, 'demo-project')]) {
      if (fs.existsSync(path.join(candidate, marker))) { readStage(candidate); found.add(path.resolve(candidate)); }
    }
  }
  if (found.size !== 1) throw new Error(found.size ? 'Open only one T-Code demo project.' : 'Open the supplied demo-project folder to begin.');
  return [...found][0];
}
module.exports = { marker, files, initialize, readStage, advance, reset, findRoot };
