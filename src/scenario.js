'use strict';
const fs = require('node:fs');
const path = require('node:path');
const tickets = [
  { id: 'TCODE-101', title: 'Build the Soft Rock Coffee menu', summary: 'Added six drinks with local photos, descriptions, prices, and Hot or Iced labels in a responsive menu.', files: ['index.html', 'styles.css'], steps: ['Read the page and local coffee photos', 'Build six drink cards with prices and descriptions', 'Style the responsive coffee menu'] },
  { id: 'TCODE-102', title: 'Add filters and an order summary', summary: 'Added All, Hot, and Iced filters, Add to order buttons, quantity controls, and a live order total.', files: ['index.html', 'styles.css', 'app.js'], steps: ['Read the existing drinks menu', 'Add temperature filters and order controls', 'Connect quantities, removal, and the order total'] }
];
const drinks = [
  { id: 'espresso', name: 'Espresso', category: 'Hot', price: 300, description: 'Small cup. Big personality. A rich double shot with a golden crema.' },
  { id: 'americano', name: 'Americano', category: 'Hot', price: 350, description: 'Our signature espresso, stretched out for a slower kind of morning.' },
  { id: 'flat-white', name: 'Flat White', category: 'Hot', price: 450, description: 'Velvety steamed milk meets a bold double shot. Smooth from the first sip.' },
  { id: 'cappuccino', name: 'Cappuccino', category: 'Hot', price: 450, description: 'Espresso, warm milk, and a soft cloud of foam. An all-time classic.' },
  { id: 'mocha', name: 'Mocha', category: 'Hot', price: 500, description: 'Dark chocolate and espresso, brought together with creamy steamed milk.' },
  { id: 'cold-brew', name: 'Cold Brew', category: 'Iced', price: 475, description: 'Slow-steeped, mellow, and poured over ice. Your afternoon B-side.' }
];
const read = name => fs.readFileSync(path.join(__dirname, 'templates', name), 'utf8');
function snapshot(stage) {
  if (![0, 1, 2].includes(stage)) throw new Error('Invalid demo stage.');
  const cards = drinks.map(drink => `      <article class="drink-card" data-category="${drink.category}">
        <div class="drink-photo"><img src="images/${drink.id}.jpg" alt="${drink.name} coffee" width="720" height="540" loading="lazy"><span class="temperature">${drink.category}</span></div>
        <div class="drink-heading"><h3>${drink.name}</h3><span class="price">$${(drink.price / 100).toFixed(2)}</span></div>
        <p>${drink.description}</p>
        ${stage === 2 ? `<button class="add-button" type="button" data-add="${drink.id}" aria-label="Add ${drink.name} to order">Add to order <span aria-hidden="true">+</span></button>` : ''}
      </article>`).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Soft Rock Coffee</title><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head>
<body>
  <header class="site-header"><a class="wordmark" href="#home" aria-label="Soft Rock Coffee home">soft rock<span>COFFEE</span></a><nav aria-label="Main navigation"><a href="#menu">Our menu</a><a href="#story">Our story</a><span class="header-note">Coffee on. World off.</span></nav></header>
  <main id="home">
    <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">FRESHLY BREWED. EASY LISTENING.</span><h1 id="hero-title">Good coffee.<br>Great <em>records.</em></h1><p>A little less rush. A little more rhythm.<br>Find your favorite cup and stay for another side.</p><a class="primary-link" href="#menu">Find your daily groove <span aria-hidden="true">↗</span></a><div class="hero-note"><span class="record" aria-hidden="true"></span><span>Small batches. Slow mornings.<br><strong>Always a good B-side.</strong></span></div></div><figure class="hero-image"><img src="images/cafe.jpg" alt="A warm café interior with wooden furniture and soft lighting" width="1600" height="1200" fetchpriority="high"><figcaption>A good place to take it slow.</figcaption></figure></section>
    <div class="marquee" aria-label="Our values"><span>GOOD BEANS</span><span aria-hidden="true">✳</span><span>WARM CUPS</span><span aria-hidden="true">✳</span><span>SOFT ROCK</span><span aria-hidden="true">✳</span><span>NO RUSH</span></div>
    <section id="menu" class="menu-section" aria-labelledby="menu-title"><div class="section-heading"><div><span class="eyebrow">THE DAILY ROTATION</span><h2 id="menu-title">Find your usual.</h2></div><p>A few classics, made with care.<br>Something for every kind of morning.</p></div>
      ${stage === 2 ? '<div class="menu-toolbar"><div class="filters" role="group" aria-label="Filter drinks"><button type="button" data-filter="All" aria-pressed="true">All drinks</button><button type="button" data-filter="Hot" aria-pressed="false">Hot</button><button type="button" data-filter="Iced" aria-pressed="false">Iced</button></div><span id="result-count" role="status">6 drinks on the menu</span></div>' : ''}
      ${stage ? `<div class="drink-grid">\n${cards}\n      </div>` : '<div class="menu-placeholder"><span class="eyebrow">SOMETHING GOOD IS BREWING</span><h3>A new menu is on the way.</h3><p>Our favorite cups are almost ready for their debut.<br>Pull up a chair. We’ll be right with you.</p></div>'}
      ${stage === 2 ? '<aside class="order-summary" aria-labelledby="order-title"><div class="order-heading"><div><span class="eyebrow">YOUR NEXT COFFEE BREAK</span><h3 id="order-title">Your order</h3></div><span id="order-count">0 drinks</span></div><p id="order-empty">Your cup is waiting. Add something you love.</p><ul id="order-items" aria-label="Items in your order"></ul><div class="order-footer"><button id="clear-order" type="button" disabled>Clear order</button><p>Total <strong id="order-total">$0.00</strong></p></div><p class="order-note">Just picking your favorites. Order at the counter when you’re ready.</p><span id="order-status" class="sr-only" role="status"></span></aside>' : ''}
    </section>
    <section id="story" class="story"><span class="eyebrow">OUR KIND OF EVERYDAY</span><h2>Come for the coffee.<br>Stay for the feeling.</h2><p>We believe in good beans, well-worn records, and the kind of conversation that makes you forget to check your phone. Nothing complicated. Just a little corner of the world to call your own.</p><span class="story-signoff">With love, Soft Rock.</span></section>
  </main><footer><a class="wordmark" href="#home">soft rock<span>COFFEE</span></a><p>Good coffee. Great records. Your kind of place.</p><a href="#menu">Back to the menu ↑</a></footer>
</body></html>
`;
  const css = read('base.css') + (stage ? read('menu.css') : '') + (stage === 2 ? read('order.css') : '');
  const js = stage < 2 ? "'use strict';\n// Soft Rock Coffee: the menu is taking shape.\n" : fs.readFileSync(path.join(__dirname, 'order.js'), 'utf8') + `\nmountMenu(${JSON.stringify(drinks)}, document);\n`;
  return { 'index.html': html.replace(/[\t ]+$/gm, ''), 'styles.css': css, 'app.js': js };
}
module.exports = { snapshot, tickets, drinks };
