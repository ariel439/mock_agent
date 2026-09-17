'use strict';
const vscode = acquireVsCodeApi();
const $ = selector => document.querySelector(selector);
let state = { busy: false, stage: 0, messages: [], error: '' };
let rendered = '';
let pending = false;
let settingsOpen = false;
$('#prompt').value = vscode.getState()?.draft || '';
const post = message => vscode.postMessage(message);
function updateControls() {
  const blocked = state.busy || pending || !!state.error || state.stage === 2;
  $('#send').disabled = blocked || !$('#prompt').value.trim();
  $('#prompt').disabled = state.busy || pending || state.stage === 2;
}
function render() {
  $('#progress').hidden = !state.busy;
  $('#progress-text').textContent = state.progress || 'Trabalhando…';
  $('#error').hidden = !state.error || settingsOpen;
  $('#error').textContent = state.error;
  const serialized = JSON.stringify(state.messages);
  if (serialized !== rendered) {
    rendered = serialized;
    $('#messages').replaceChildren();
    for (const message of state.messages) {
      const article = document.createElement('article');
      article.className = `message ${message.role}`;
      if (message.role === 'assistant') {
        const label = document.createElement('span'); label.className = 'role'; label.textContent = 'Concluído'; article.append(label);
      }
      const content = document.createElement('div'); content.className = 'message-content'; content.textContent = message.text; article.append(content);
      if (message.files?.length) {
        const card = document.createElement('section'); card.className = 'change-card'; card.setAttribute('aria-label', 'Alterações aplicadas');
        const header = document.createElement('div'); header.className = 'change-header';
        const summary = document.createElement('div'); summary.className = 'change-summary';
        const title = document.createElement('strong'); title.textContent = message.files.length + (message.files.length === 1 ? ' arquivo alterado' : ' arquivos alterados');
        summary.append(title);
        function stats(additions, deletions) {
          const group = document.createElement('span'); group.className = 'diff-stats';
          group.setAttribute('aria-label', additions + ' linhas adicionadas, ' + deletions + ' removidas');
          const added = document.createElement('span'); added.className = 'addition'; added.textContent = '+' + additions;
          const removed = document.createElement('span'); removed.className = 'deletion'; removed.textContent = '−' + deletions;
          group.append(added, removed); return group;
        }
        if (message.changes) summary.append(stats(message.changes.reduce((n, f) => n + f.additions, 0), message.changes.reduce((n, f) => n + f.deletions, 0)));
        const review = document.createElement('button'); review.className = 'review-button'; review.textContent = 'Revisar'; review.title = 'Escolher um arquivo para comparar';
        review.addEventListener('click', () => post({ type: 'review', stage: message.stage }));
        header.append(summary, review); card.append(header);
        const list = document.createElement('div'); list.className = 'file-list';
        for (const name of message.files) {
          const row = document.createElement('div'); row.className = 'file-row';
          const diff = document.createElement('button'); diff.className = 'diff-button'; diff.textContent = name;
          diff.title = 'Comparar antes e depois de ' + name; diff.setAttribute('aria-label', 'Ver alterações em ' + name);
          diff.addEventListener('click', () => post({ type: 'diff', name, stage: message.stage }));
          row.append(diff);
          const change = message.changes?.find(file => file.name === name);
          if (change) row.append(stats(change.additions, change.deletions));
          const open = document.createElement('button'); open.className = 'file-button'; open.textContent = '↗'; open.title = 'Revisar alterações em ' + name; open.setAttribute('aria-label', 'Revisar alterações em ' + name);
          open.addEventListener('click', () => post({ type: 'diff', name, stage: message.stage })); row.append(open);
          list.append(row);
        }
        card.append(list); article.append(card);
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
$('#settings-toggle').addEventListener('click', () => {
  settingsOpen = !settingsOpen;
  $('#settings').hidden = !settingsOpen;
  $('#conversation').hidden = settingsOpen;
  $('#composer').hidden = settingsOpen;
  $('#error').hidden = settingsOpen || !state.error;
  $('#settings-toggle').setAttribute('aria-expanded', String(settingsOpen));
  $('#settings-toggle').title = settingsOpen ? 'Voltar à conversa' : 'Configurações';
  $('#settings-toggle').setAttribute('aria-label', $('#settings-toggle').title);
  if (settingsOpen) $('#api-url').focus(); else $('#prompt').focus();
});
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  $('#save-settings').disabled = true;
  $('#settings-status').textContent = 'Salvando…';
  post({ type: 'saveSettings', baseUrl: $('#api-url').value, secret: $('#api-secret').value, model: $('#agent-model').value });
});
window.addEventListener('message', event => {
  const data = event.data;
  if (data.type === 'settings') {
    $('#api-url').value = data.baseUrl;
    $('#agent-model').replaceChildren(...data.models.map(model => {
      const option = document.createElement('option'); option.value = model; option.textContent = model; return option;
    }));
    $('#agent-model').value = data.model;
    $('#api-secret').value = '';
    $('#api-secret').placeholder = data.hasSecret ? 'Chave salva. Digite outra para substituir.' : 'Cole a chave da API';
    $('#settings-status').textContent = data.saved ? 'Configurações salvas.' : '';
    $('#save-settings').disabled = false;
  } else if (data.type === 'settingsError') {
    $('#settings-status').textContent = data.message;
    $('#save-settings').disabled = false;
  }
});
resizePrompt(); render(); post({ type: 'ready' });
