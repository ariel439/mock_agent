'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runTests } = require('@vscode/test-electron');
const demo = require('../src/demo');
async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 't-code-host-'));
  const workspace = path.join(temp, 'demo-project');
  demo.initialize(workspace);
  try {
    await runTests({
      ...(process.env.TCODE_VSCODE_EXECUTABLE ? { vscodeExecutablePath: process.env.TCODE_VSCODE_EXECUTABLE } : {}),
      extensionDevelopmentPath: path.resolve(__dirname, '..'),
      extensionTestsPath: path.resolve(__dirname, '..', 'tests', 'host.js'),
      extensionTestsEnv: { ELECTRON_RUN_AS_NODE: undefined },
      launchArgs: [workspace, '--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--user-data-dir=' + path.join(temp, 'user'), '--extensions-dir=' + path.join(temp, 'extensions')]
    });
  } finally { fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
