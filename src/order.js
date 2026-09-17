'use strict';
function money(cents) { return 'R$ ' + (cents / 100).toFixed(2).replace('.', ','); }
function changeQuantity(order, id, delta, drinks) {
  if (!drinks.some(drink => drink.id === id) || !Number.isInteger(delta)) return { ...order };
  const next = { ...order };
  const quantity = Math.max(0, Math.min(99, (next[id] || 0) + delta));
  if (quantity) next[id] = quantity; else delete next[id];
  return next;
}
function totalCents(order, drinks) { return drinks.reduce((sum, drink) => sum + drink.price * (order[drink.id] || 0), 0); }
function mountMenu(drinks, doc) {
  let order = {};
  const drawer = doc.querySelector('#order-drawer');
  const list = doc.querySelector('#order-items');
  const launcher = doc.querySelector('#view-order');
  const close = doc.querySelector('#close-order');
  const open = () => { if (!drawer.open) drawer.showModal(); };
  launcher.addEventListener('click', open);
  close.addEventListener('click', () => drawer.close());
  doc.querySelector('#continue-order').addEventListener('click', () => drawer.close());
  function render(announcement = '') {
    list.replaceChildren();
    for (const drink of drinks) {
      const quantity = order[drink.id];
      if (!quantity) continue;
      const row = doc.createElement('li'); row.className = 'order-item'; row.dataset.item = drink.id;
      const heading = doc.createElement('div'); heading.className = 'order-item-heading';
      const name = doc.createElement('h3'); name.textContent = drink.name;
      const subtotal = doc.createElement('strong'); subtotal.textContent = money(drink.price * quantity);
      heading.append(name, subtotal);
      const unit = doc.createElement('p'); unit.textContent = money(drink.price) + ' por unidade';
      const actions = doc.createElement('div'); actions.className = 'order-item-actions';
      const controls = doc.createElement('div'); controls.className = 'quantity-controls';
      function button(delta, label, text) {
        const el = doc.createElement('button'); el.type = 'button'; el.textContent = text;
        el.setAttribute('aria-label', label + ' ' + drink.name); el.dataset.control = drink.id + ':' + delta;
        el.disabled = delta === 1 && quantity === 99;
        el.addEventListener('click', () => {
          order = changeQuantity(order, drink.id, delta, drinks);
          render(drink.name + ': ' + (order[drink.id] || 0) + ' no pedido.');
          const replacement = [...doc.querySelectorAll('[data-control]')].find(item => item.dataset.control === el.dataset.control);
          if (replacement && !replacement.disabled) replacement.focus();
          else if (order[drink.id]) doc.querySelector(`[data-control="${drink.id}:-1"]`).focus();
          else close.focus();
        });
        return el;
      }
      const count = doc.createElement('span'); count.textContent = quantity; count.setAttribute('aria-label', 'Quantidade de ' + drink.name);
      controls.append(button(-1, 'Diminuir', '−'), count, button(1, 'Aumentar', '+'));
      const remove = doc.createElement('button'); remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Remover'; remove.setAttribute('aria-label', 'Remover ' + drink.name);
      remove.addEventListener('click', () => { delete order[drink.id]; render(drink.name + ' removido.'); close.focus(); });
      actions.append(controls, remove); row.append(heading, unit, actions); list.append(row);
    }
    const count = Object.values(order).reduce((sum, n) => sum + n, 0);
    const total = money(totalCents(order, drinks));
    doc.querySelector('#order-total').textContent = total;
    doc.querySelector('#launcher-total').textContent = total;
    doc.querySelector('#launcher-count').textContent = count;
    launcher.setAttribute('aria-label', `Ver pedido: ${count} ${count === 1 ? 'bebida' : 'bebidas'}, ${total}`);
    doc.querySelector('#order-empty').hidden = count !== 0;
    doc.querySelector('#clear-order').disabled = count === 0;
    for (const id of ['order-status', 'drawer-status']) doc.querySelector('#' + id).textContent = announcement ? announcement + ' Total: ' + total : '';
  }
  for (const add of doc.querySelectorAll('[data-add]')) add.addEventListener('click', () => {
    order = changeQuantity(order, add.dataset.add, 1, drinks);
    render(drinks.find(drink => drink.id === add.dataset.add).name + ' adicionado.');
  });
  doc.querySelector('#clear-order').addEventListener('click', () => { order = {}; render('Pedido limpo.'); close.focus(); });
  render();
}
if (typeof module !== 'undefined') module.exports = { money, changeQuantity, totalCents, mountMenu };
