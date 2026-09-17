'use strict';
const vscode = acquireVsCodeApi();
const $ = selector => document.querySelector(selector);
let state = { busy: false, stage: 0, messages: [], error: '' };
let rendered = '';
let pending = false;
$('#prompt').value = vscode.getState()?.draft || '';
const post = message => vscode.postMessage(message);
function updateControls() {
  const blocked = state.busy || pending || !!state.error || state.stage === 2;
  $('#send').disabled = blocked || !$('#prompt').value.trim();
  $('#prompt').disabled = state.busy || pending || state.stage === 2;
}
function render() {
  $('#progress').hidden = !state.busy;
  $('#progress-text').textContent = state.progress || 'Working…';
  $('#error').hidden = !state.error;
  $('#error').textContent = state.error;
  const serialized = JSON.stringify(state.messages);
  if (serialized !== rendered) {
    rendered = serialized;
    $('#messages').replaceChildren();
    for (const message of state.messages) {
      const article = document.createElement('article');
      article.className = `message ${message.role}`;
      if (message.role === 'assistant') {
        const label = document.createElement('span'); label.className = 'role'; label.textContent = 'Completed'; article.append(label);
      }
      const content = document.createElement('div'); content.className = 'message-content'; content.textContent = message.text; article.append(content);
      if (message.files) {
        const list = document.createElement('div'); list.className = 'file-list';
        for (const name of message.files) {
          const row = document.createElement('div'); row.className = 'file-row';
          const file = document.createElement('button'); file.className = 'file-button'; file.textContent = name;
          file.title = `Open ${name}`; file.addEventListener('click', () => post({ type: 'file', name }));
          const diff = document.createElement('button'); diff.className = 'diff-button'; diff.textContent = 'View diff';
          diff.setAttribute('aria-label', `View ${name} changes`); diff.addEventListener('click', () => post({ type: 'diff', name, stage: message.stage }));
          row.append(file, diff); list.append(row);
        }
        article.append(list);
        const status = document.createElement('div'); status.className = 'applied'; status.textContent = `${message.files.length} files changed`; article.append(status);
      }
      $('#messages').append(article);
    }
    $('#conversation').scrollTop = $('#conversation').scrollHeight;
  }
  updateControls();
}
$('#composer').addEventListener('submit', event => {
  event.preventDefault();
  if ($('#send').disabled) return;
  const text = $('#prompt').value;
  pending = true;
  $('#prompt').value = '';
  resizePrompt();
  vscode.setState({ draft: '' });
  updateControls();
  post({ type: 'submit', text });
});
function resizePrompt() {
  $('#prompt').style.height = 'auto';
  $('#prompt').style.height = `${Math.min(252, Math.max(42, $('#prompt').scrollHeight))}px`;
}
$('#prompt').addEventListener('input', () => { vscode.setState({ draft: $('#prompt').value }); resizePrompt(); updateControls(); });
$('#prompt').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('#composer').requestSubmit(); }
});
window.addEventListener('message', event => {
  if (event.data.type === 'state') { state = event.data; pending = false; render(); }
});
resizePrompt(); render(); post({ type: 'ready' });
