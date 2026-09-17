'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { money } = require('./order');
const tickets = [
  { id: 'TCODE-101', title: 'Organizar o cardápio por temperatura', summary: 'Organizei o cardápio em Clássicos quentes e Cafés gelados, com uma foto de destaque por seção. Preservei as bebidas, os preços e o restante da página.', files: ['index.html', 'styles.css'], steps: ['Lendo o cardápio e as fotos disponíveis', 'Agrupando as bebidas quentes e geladas', 'Ajustando a composição do cardápio para desktop e celular'] },
  { id: 'TCODE-102', title: 'Montar um pedido para levar', summary: 'Adicionei botões de adicionar e uma sacola lateral com quantidades, remoção e total em reais. No celular, a barra inferior permite reabrir o pedido.', files: ['index.html', 'styles.css', 'app.js'], steps: ['Lendo as bebidas e os preços do cardápio', 'Conectando os botões à sacola de pedidos', 'Atualizando quantidades, total e acesso pelo celular'] }
];
const drinks = [
  { id: 'espresso', name: 'Espresso', category: 'hot', price: 800, description: 'Curto, intenso e com uma crema que fica na memória.' },
  { id: 'americano', name: 'Americano', category: 'hot', price: 1000, description: 'Nosso espresso, com mais tempo para apreciar.' },
  { id: 'flat-white', name: 'Flat White', category: 'hot', price: 1400, description: 'Dose dupla, leite aveludado e o equilíbrio certo.' },
  { id: 'cappuccino', name: 'Cappuccino', category: 'hot', price: 1400, description: 'Espresso, leite e uma camada generosa de espuma.' },
  { id: 'cold-brew', name: 'Cold Brew', category: 'iced', price: 1600, description: 'Extração lenta, gelo e um final naturalmente doce.' },
  { id: 'mocha', name: 'Mocha gelado', category: 'iced', price: 1800, description: 'Café, chocolate e leite. O lado doce da sua pausa.' }
];
const read = name => fs.readFileSync(path.join(__dirname, 'templates', name), 'utf8');
function formatHtml(html) {
  const voidTags = new Set(['meta', 'link', 'img', 'br', 'input']);
  let depth = 0;
  return html.replace(/>\s*</g, '>\n<').replace(/(<script[^>]*>)\n(<\/script>)/g, '$1$2').split('\n').filter(line => line.trim()).map(line => {
    line = line.trim();
    const startsWithClose = /^<\//.test(line);
    const indent = Math.max(0, depth - (startsWithClose ? 1 : 0));
    for (const tag of line.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
      if (!voidTags.has(tag[2])) depth += tag[1] ? -1 : 1;
    }
    return '  '.repeat(indent) + line;
  }).join('\n') + '\n';
}
function formatCss(css) {
  let depth = 0;
  return css.replace(/\s*{\s*/g, ' {\n').replace(/;\s*/g, ';\n').replace(/\s*}\s*/g, '\n}\n').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    if (line === '}') depth = Math.max(0, depth - 1);
    const result = '  '.repeat(depth) + line;
    if (line.endsWith('{')) depth++;
    return result;
  }).join('\n') + '\n';
}
function snapshot(stage) {
  if (![0, 1, 2].includes(stage)) throw new Error('Etapa de demonstração inválida.');
  const row = drink => `<li class="drink-row" data-drink="${drink.id}"><div class="drink-copy"><h3>${drink.name}</h3><p>${drink.description}</p></div><span class="drink-price">${money(drink.price)}</span>${stage === 2 ? `<button class="add-drink" type="button" data-add="${drink.id}" aria-label="Adicionar ${drink.name} ao pedido"><span class="plus-icon" aria-hidden="true"></span></button>` : ''}</li>`;
  const menu = stage === 0 ? `<div class="simple-menu"><div class="menu-intro"><span class="eyebrow">ESCOLHA SUA PAUSA</span><h3>Seu café de sempre.<br>Ou um novo favorito.</h3><p>Grãos especiais, receitas da casa e um cuidado que você sente no primeiro gole.</p><span class="menu-stamp" aria-hidden="true">feito com calma<br>♡</span></div><ul class="drink-list">${drinks.map(row).join('')}</ul></div>` : `<div class="menu-groups"><section class="menu-group" aria-labelledby="hot-title"><figure class="menu-photo"><img src="images/cappuccino.jpg" alt="Cappuccino com espuma cremosa em uma xícara" width="720" height="540" loading="lazy"><figcaption>01 / ACONCHEGO EM UMA XÍCARA</figcaption></figure><div class="group-content"><span class="eyebrow">PARA AQUECER O DIA</span><h3 id="hot-title" class="group-title">Clássicos quentes<span>01</span></h3><ul class="drink-list">${drinks.filter(drink => drink.category === 'hot').map(row).join('')}</ul></div></section><section class="menu-group iced-group" aria-labelledby="iced-title"><figure class="menu-photo"><img src="images/cold-brew.jpg" alt="Cold brew servido com gelo em um copo" width="720" height="540" loading="lazy"><figcaption>02 / UM RESPIRO, COM GELO</figcaption></figure><div class="group-content"><span class="eyebrow">LEVEZA EM OUTRO RITMO</span><h3 id="iced-title" class="group-title">Cafés gelados<span>02</span></h3><ul class="drink-list">${drinks.filter(drink => drink.category === 'iced').map(row).join('')}</ul><p class="iced-note">Extraído com tempo.<br>Servido sem pressa.</p></div></section></div>`;
  const drawer = stage === 2 ? `<button id="view-order" class="order-launcher" type="button" aria-haspopup="dialog">Ver pedido <span aria-hidden="true">·</span> <span id="launcher-total">R$ 0,00</span><span id="launcher-count" class="order-count">0</span></button><dialog id="order-drawer" aria-labelledby="order-title"><div class="drawer-header"><div><span class="eyebrow">UMA PAUSA PARA LEVAR</span><h2 id="order-title">Seu pedido<span>.</span></h2></div><button id="close-order" class="close-order" type="button" aria-label="Fechar pedido" autofocus>×</button></div><p class="pickup-note">Feito na hora. Para acompanhar o seu dia.</p><p id="order-empty">Sua próxima pausa começa no cardápio.</p><ul id="order-items" aria-label="Bebidas do pedido"></ul><div class="drawer-bottom"><button id="clear-order" type="button">Limpar pedido</button><div class="order-total"><span>Total</span><strong id="order-total">R$ 0,00</strong></div><p>Mostre sua seleção no balcão para pedir e pagar. Nenhum pedido é enviado por esta página.</p><button id="continue-order" type="button" class="primary-button">Continuar escolhendo <span aria-hidden="true">↗</span></button></div><p id="drawer-status" class="sr-only" role="status"></p></dialog><p id="order-status" class="sr-only" role="status"></p>` : '';
  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Soft Rock Coffee — café bom, no seu ritmo</title><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head>
<body>
<header class="site-header"><a class="wordmark" href="#home" aria-label="Soft Rock Coffee, início">soft rock<span>COFFEE</span></a><nav aria-label="Navegação principal"><a href="#menu">Cardápio</a><a href="#story">Nossa história</a></nav><span class="header-note"><span aria-hidden="true">✳</span> Café bom. Sem pressa.</span></header>
<main id="home">
<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">CAFÉ ESPECIAL. UM LADO B MELHOR.</span><h1 id="hero-title">Um bom café.<br>Um disco.<br><em>O seu tempo.</em></h1><p>Uma pausa no barulho lá fora.<br>Por aqui, a gente passa o café e deixa o disco tocar.</p><a class="primary-button" href="#menu">Encontre seu café <span aria-hidden="true">↗</span></a><div class="hero-signoff"><span class="record" aria-hidden="true"></span><span>Grãos escolhidos a dedo.<br>Boas músicas também.</span></div></div><figure class="hero-photo"><img src="images/cafe.jpg" alt="Interior acolhedor de uma cafeteria com mesas de madeira e luz natural" width="1600" height="1200" fetchpriority="high"><figcaption>SEU NOVO CANTINHO DE SEMPRE.</figcaption><div class="photo-seal" aria-hidden="true">café &amp;<br>boas<br>companhias</div></figure></section>
<div class="marquee" aria-label="Nossa essência"><span>CAFÉ DE VERDADE</span><span aria-hidden="true">✳</span><span>DISCOS INTEIROS</span><span aria-hidden="true">✳</span><span>CONVERSA BOA</span><span aria-hidden="true">✳</span><span>SEM PRESSA</span></div>
<section id="menu" class="menu-section" aria-labelledby="menu-title"><div class="section-heading"><div><span class="eyebrow">NOSSA SELEÇÃO, TODO DIA</span><h2 id="menu-title">Qual é o seu <em>ritmo?</em></h2></div><p>Clássicos bem-feitos. Pequenas descobertas.<br>O próximo favorito pode estar aqui.</p></div>${menu}<div class="menu-footnote"><span>Preparado na hora, com grãos especiais.</span><span>Todos os preços em reais.</span></div></section>
<section id="story" class="story" aria-labelledby="story-title"><span class="eyebrow">MAIS QUE UMA XÍCARA</span><div class="story-layout"><h2 id="story-title">Entre pelo café.<br>Fique pela <em>boa companhia.</em></h2><div><p>Acreditamos em bons grãos, discos que a gente conhece de cor e conversas que fazem esquecer o celular.</p><p>Sem complicar. Só um pequeno lugar no mundo para chamar de seu.</p><span class="story-signoff">Com carinho, Soft Rock.</span></div></div></section>
</main><footer class="site-footer"><a class="wordmark" href="#home">soft rock<span>COFFEE</span></a><div><span class="eyebrow">PASSE POR AQUI</span><p>Segunda a sexta · 8h às 18h<br>Sábado · 9h às 16h</p></div><a class="back-link" href="#menu">Mais um café? <span aria-hidden="true">↑</span></a></footer>
${drawer}
</body></html>
`;
  return { 'index.html': formatHtml(html), 'styles.css': formatCss(read('base.css') + (stage ? read('menu.css') : '') + (stage === 2 ? read('order.css') : '')), 'app.js': stage === 2 ? fs.readFileSync(path.join(__dirname, 'order.js'), 'utf8') + `\nmountMenu(${JSON.stringify(drinks)}, document);\n` : "'use strict';\n// Soft Rock Coffee: cardápio da casa.\n" };
}
module.exports = { snapshot, tickets, drinks };
