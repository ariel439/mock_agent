'use strict';
const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const demo = require('./demo');
const { tickets } = require('./scenario');
const { createSettings } = require('./settings');
const { summarizeChanges } = require('./changes');

function activate(context) {
  const settings = createSettings(context);
  let view, preview, busy = false, disposed = false;
  let messages = context.workspaceState.get('messages', []);
  let lastStage = context.workspaceState.get('stage', 0);
  let progress = '';
  const root = () => demo.findRoot((vscode.workspace.workspaceFolders || []).filter(f => f.uri.scheme === 'file').map(f => f.uri.fsPath));
  const persist = async () => { await context.workspaceState.update('messages', messages); await context.workspaceState.update('stage', lastStage); };
  function state() {
    let stage = 0, error = '';
    try {
      stage = demo.readStage(root());
      if (stage < lastStage) { messages = []; void persist(); }
      lastStage = stage;
    } catch (e) { error = e.message; }
    return { type: 'state', stage, error, busy, progress, messages, tickets };
  }
  const publish = () => view?.webview.postMessage(state());
  function ensureSaved(folder) {
    const dirty = vscode.workspace.textDocuments.find(doc => doc.isDirty && demo.files.some(name => doc.uri.fsPath === path.join(folder, name)));
    if (dirty) throw new Error(`Salve ou reverta ${path.basename(dirty.uri.fsPath)} antes de alterar a demonstração.`);
  }
  function refreshPreview() {
    if (!preview) return;
    const folder = root();
    preview.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(folder, 'images'))] };
    const nonce = crypto.randomBytes(16).toString('hex');
    let html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
    html = html.replace('<link rel="stylesheet" href="styles.css">', `<style nonce="${nonce}">${fs.readFileSync(path.join(folder, 'styles.css'), 'utf8')}</style>`);
    html = html.replace('<script src="app.js" defer></script>', '');
    html = html.replace('</body>', `<script nonce="${nonce}">${fs.readFileSync(path.join(folder, 'app.js'), 'utf8')}</script></body>`);
    html = html.replace(/src="images\/([a-z-]+\.jpg)"/g, (_, name) => `src="${preview.webview.asWebviewUri(vscode.Uri.file(path.join(folder, 'images', name)))}"`);
    html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${preview.webview.cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'none';">`);
    preview.webview.html = html;
  }
  async function showPreview() {
    root();
    if (!preview) {
      preview = vscode.window.createWebviewPanel('tCode.preview', 'Soft Rock Coffee', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [] });
      preview.onDidDispose(() => { preview = undefined; }, null, context.subscriptions);
    } else preview.reveal(vscode.ViewColumn.One, true);
    refreshPreview();
  }
  async function submit(text) {
    if (busy || typeof text !== 'string' || !text.trim()) return;
    if (text.length > 20000) throw new Error('Use menos de 20.000 caracteres na solicitação.');
    const folder = root();
    ensureSaved(folder);
    const current = state();
    if (current.stage === 2) throw new Error('As duas tarefas foram concluídas. Reinicie a demonstração para apresentar novamente.');
    busy = true;
    messages.push({ role: 'user', text: text.trim() });
    publish();
    try {
      const ticket = tickets[current.stage];
      for (const step of ticket.steps) {
        progress = step;
        publish();
        await new Promise(resolve => setTimeout(resolve, 7500 / ticket.steps.length));
        if (disposed) return;
      }
      ensureSaved(folder);
      if (demo.readStage(folder) !== current.stage) throw new Error('A demonstração mudou durante a execução. Envie a tarefa novamente.');
      const result = demo.advance(folder);
      lastStage = result.stage;
      const changes = summarizeChanges(result.before, result.after);
      messages.push({ role: 'assistant', text: `${ticket.id} · ${ticket.title}\n\n${ticket.summary}`, files: changes.map(file => file.name), changes, stage: result.stage });
      await persist();
      refreshPreview();
    } catch (e) {
      messages.push({ role: 'error', text: e.message });
      await persist();
    } finally {
      busy = false;
      progress = '';
      publish();
    }
  }
  async function resetDemo() {
    if (busy) return;
    const folder = root();
    ensureSaved(folder);
    const choice = await vscode.window.showWarningMessage('Reiniciar a demonstração? Isso restaura index.html, styles.css e app.js e limpa a conversa.', { modal: true }, 'Reiniciar demonstração');
    if (choice !== 'Reiniciar demonstração' || busy) return;
    ensureSaved(folder);
    demo.reset(folder);
    messages = []; lastStage = 0;
    await persist();
    refreshPreview(); publish();
  }
  async function showDiff(name, stage) {
    if (!demo.files.includes(name) || ![1, 2].includes(stage)) return;
    const before = vscode.Uri.parse(`t-code-snapshot:/${stage - 1}/${name}`);
    const after = vscode.Uri.parse(`t-code-snapshot:/${stage}/${name}`);
    await vscode.commands.executeCommand('vscode.diff', before, after, `${name} · TCODE-${100 + stage}`, { preview: false });
  }
  async function review(stage) {
    if (![1, 2].includes(stage)) return;
    const { snapshot } = require('./scenario');
    const changes = summarizeChanges(snapshot(stage - 1), snapshot(stage));
    const selected = await vscode.window.showQuickPick(changes.map(file => ({ label: file.name, description: `+${file.additions} −${file.deletions}` })), { title: `Revisar alterações · TCODE-${100 + stage}`, placeHolder: 'Escolha um arquivo para comparar antes e depois' });
    if (selected) await showDiff(selected.label, stage);
  }
  const safely = fn => async (...args) => {
    try { return await fn(...args); }
    catch (e) { vscode.window.showErrorMessage(`T-Code: ${e.message}`); publish(); }
  };
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('tCode.chat', {
    resolveWebviewView(resolved) {
      view = resolved;
      const media = vscode.Uri.joinPath(context.extensionUri, 'media');
      view.webview.options = { enableScripts: true, localResourceRoots: [media] };
      const nonce = crypto.randomBytes(16).toString('hex');
      const css = view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'chat.css'));
      const js = view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'chat.js'));
      view.webview.html = fs.readFileSync(path.join(context.extensionPath, 'media', 'chat.html'), 'utf8')
        .replaceAll('{{cspSource}}', view.webview.cspSource).replaceAll('{{nonce}}', nonce).replaceAll('{{css}}', String(css)).replaceAll('{{js}}', String(js));
      view.webview.onDidReceiveMessage(safely(async message => {
        if (!message || typeof message !== 'object') return;
        switch (message.type) {
          case 'ready': publish(); view.webview.postMessage(await settings.read()); break;
          case 'saveSettings': {
            try { view.webview.postMessage(await settings.save(message)); }
            catch (error) { view.webview.postMessage({ type: 'settingsError', message: error.message }); }
            break;
          }
          case 'submit': await submit(message.text); break;
          case 'reset': await resetDemo(); break;
          case 'preview': await showPreview(); break;
          case 'review': await review(message.stage); break;
          case 'ticket': {
            if (![0, 1].includes(message.index)) return;
            const content = fs.readFileSync(path.join(context.extensionPath, 'tickets', `TCODE-${101 + message.index}.md`), 'utf8');
            view.webview.postMessage({ type: 'draft', text: content });
            break;
          }
          case 'file': {
            if (!demo.files.includes(message.name)) return;
            await vscode.window.showTextDocument(vscode.Uri.file(path.join(root(), message.name)), { preview: false });
            break;
          }
          case 'diff': {
            await showDiff(message.name, message.stage);
            break;
          }
        }
      }), null, context.subscriptions);
      view.onDidDispose(() => { view = undefined; }, null, context.subscriptions);
    }
  }));
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('t-code-snapshot', {
    provideTextDocumentContent(uri) {
      const [, stage, name] = uri.path.split('/');
      if (!demo.files.includes(name) || !['0', '1', '2'].includes(stage)) return '';
      return require('./scenario').snapshot(Number(stage))[name];
    }
  }));
  context.subscriptions.push(
    vscode.commands.registerCommand('tCode.focus', () => vscode.commands.executeCommand('tCode.chat.focus')),
    vscode.commands.registerCommand('tCode.preview', safely(showPreview)),
    vscode.commands.registerCommand('tCode.reset', safely(resetDemo)),
    vscode.workspace.onDidChangeWorkspaceFolders(() => publish()),
    { dispose() { disposed = true; preview?.dispose(); } }
  );
  const watcher = vscode.workspace.createFileSystemWatcher('**/.t-code-demo.json');
  const changed = () => { if (!busy) { publish(); try { refreshPreview(); } catch { /* Closed workspace. */ } } };
  context.subscriptions.push(watcher, watcher.onDidChange(changed), watcher.onDidCreate(changed), watcher.onDidDelete(changed));
  // The same entry point used by the chat is exposed to the Extension Host test.
  return { submit, state, showPreview, showDiff };
}
module.exports = { activate };
