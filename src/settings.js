'use strict';
const models = ['GLM 5.2', 'Qwen 3.6 120B', 'Mistral 4 119B', 'GPT OSS 120B', 'NVIDIA Nemotron 3'];
function createSettings(context) {
  const key = 'tCode.apiSecret';
  return {
    async read() {
      const saved = context.globalState.get('provider', {});
      return { type: 'settings', baseUrl: saved.baseUrl || '', model: models.includes(saved.model) ? saved.model : models[0], models, hasSecret: !!(await context.secrets.get(key)) };
    },
    async save(input) {
      if (typeof input.baseUrl !== 'string' || typeof input.secret !== 'string' || !models.includes(input.model)) throw new Error('Confira a URL da API e o modelo selecionado.');
      let url;
      try { url = new URL(input.baseUrl.trim()); } catch { throw new Error('Informe uma URL válida para a API.'); }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use uma URL HTTP ou HTTPS sem credenciais.');
      if (!input.secret.trim() && !(await context.secrets.get(key))) throw new Error('Informe a chave secreta da API.');
      if (input.secret.trim()) await context.secrets.store(key, input.secret.trim());
      await context.globalState.update('provider', { baseUrl: input.baseUrl.trim(), model: input.model });
      return { ...await this.read(), saved: true };
    }
  };
}
module.exports = { models, createSettings };
