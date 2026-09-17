'use strict';

function changeQuantity(order, id, delta, drinks) {
  if (!drinks.some(drink => drink.id === id) || !Number.isInteger(delta)) return { ...order };
  const next = { ...order };
  const quantity = Math.max(0, Math.min(99, (next[id] || 0) + delta));
  if (quantity) next[id] = quantity;
  else delete next[id];
  return next;
}

function totalCents(order, drinks) {
  return drinks.reduce((total, drink) => total + drink.price * (order[drink.id] || 0), 0);
}

function mountMenu(drinks, doc) {
  const money = cents => '$' + (cents / 100).toFixed(2);
  let order = {};
  const filters = [...doc.querySelectorAll('[data-filter]')];
  const cards = [...doc.querySelectorAll('.drink-card')];
  function focusMenu(id) {
    const add = doc.querySelector('[data-add="' + id + '"]');
    const target = add && !add.closest('.drink-card').hidden ? add : filters.find(button => button.getAttribute('aria-pressed') === 'true');
    target.focus();
  }
  for (const button of filters) button.addEventListener('click', () => {
    let count = 0;
    for (const card of cards) {
      card.hidden = button.dataset.filter !== 'All' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    }
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
    doc.querySelector('#result-count').textContent = count + (count === 1 ? ' drink on the menu' : ' drinks on the menu');
  });
  function renderOrder(announcement = '') {
    const list = doc.querySelector('#order-items');
    list.replaceChildren();
    for (const drink of drinks) {
      const quantity = order[drink.id];
      if (!quantity) continue;
      const row = doc.createElement('li'); row.className = 'order-item';
      const name = doc.createElement('span'); name.className = 'order-item-name'; name.textContent = drink.name;
      const controls = doc.createElement('div'); controls.className = 'quantity-controls';
      const count = doc.createElement('span'); count.textContent = String(quantity); count.setAttribute('aria-label', drink.name + ' quantity');
      function quantityButton(delta, label, text) {
        const button = doc.createElement('button'); button.type = 'button'; button.textContent = text;
        button.setAttribute('aria-label', label + ' ' + drink.name); button.dataset.control = drink.id + '-' + delta;
        button.addEventListener('click', () => {
          order = changeQuantity(order, drink.id, delta, drinks);
          renderOrder(drink.name + ' quantity: ' + (order[drink.id] || 0));
          const replacement = [...doc.querySelectorAll('[data-control]')].find(el => el.dataset.control === button.dataset.control);
          if (replacement) replacement.focus();
          else focusMenu(drink.id);
        });
        return button;
      }
      controls.append(quantityButton(-1, 'Decrease', '−'), count, quantityButton(1, 'Increase', '+'));
      const subtotal = doc.createElement('span'); subtotal.className = 'line-total'; subtotal.textContent = money(quantity * drink.price);
      const remove = doc.createElement('button'); remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', 'Remove ' + drink.name);
      remove.addEventListener('click', () => { delete order[drink.id]; renderOrder(drink.name + ' removed'); focusMenu(drink.id); });
      row.append(name, controls, subtotal, remove); list.append(row);
    }
    const count = Object.values(order).reduce((sum, quantity) => sum + quantity, 0);
    doc.querySelector('#order-count').textContent = count + (count === 1 ? ' drink' : ' drinks');
    doc.querySelector('#order-empty').hidden = count !== 0;
    doc.querySelector('#order-total').textContent = money(totalCents(order, drinks));
    doc.querySelector('#clear-order').disabled = count === 0;
    doc.querySelector('#order-status').textContent = announcement ? announcement + '. Total ' + money(totalCents(order, drinks)) : '';
  }
  for (const button of doc.querySelectorAll('[data-add]')) button.addEventListener('click', () => {
    order = changeQuantity(order, button.dataset.add, 1, drinks);
    renderOrder(drinks.find(drink => drink.id === button.dataset.add).name + ' added');
  });
  doc.querySelector('#clear-order').addEventListener('click', () => { order = {}; renderOrder('Order cleared'); focusMenu(drinks[0].id); });
  renderOrder();
}

if (typeof module !== 'undefined') module.exports = { changeQuantity, totalCents, mountMenu };
