'use strict';

const tickets = [
  { id: 'TCODE-101', title: 'Build the service catalog', summary: 'Added six service cards, category labels, availability indicators, and a responsive grid.', files: ['index.html', 'styles.css'], steps: ['Read index.html and styles.css', 'Build six service cards and availability labels', 'Apply the responsive magenta design'] },
  { id: 'TCODE-102', title: 'Make services easy to find', summary: 'Added live search, category filters, a result count, and an empty state with a clear-filters action.', files: ['index.html', 'styles.css', 'app.js'], steps: ['Read the existing service catalog', 'Add search and category controls', 'Wire live filtering and the empty state'] }
];
const services = [
  ['01', 'Cloud workspace', 'Infrastructure', 'Secure environments, ready for your next idea.', 'Available'],
  ['02', 'Access management', 'Security', 'The right access for every member of your team.', 'Available'],
  ['03', 'Data platform', 'Data', 'Turn business data into decisions that matter.', 'Available'],
  ['04', 'Network connect', 'Infrastructure', 'Keep your people and systems connected.', 'Maintenance'],
  ['05', 'Security operations', 'Security', 'Protection and monitoring around the clock.', 'Available'],
  ['06', 'Analytics studio', 'Data', 'A shared space for reports and insights.', 'Available']
];

function snapshot(stage) {
  if (![0, 1, 2].includes(stage)) throw new Error('Invalid demo stage.');
  const cards = services.map(([number, name, category, description, status]) => `<article class="service-card" data-name="${name.toLowerCase()}" data-category="${category}">
        <div class="card-top"><span class="service-number">${number}</span><span class="status ${status === 'Maintenance' ? 'maintenance' : ''}">${status}</span></div>
        <span class="category">${category}</span><h3>${name}</h3><p>${description}</p><span class="card-foot">Managed service <span aria-hidden="true">↗</span></span>
      </article>`).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Service Hub · T-Code</title><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head>
<body>
  <header class="site-header"><a class="brand" href="#main"><span class="brand-mark">T</span><span>Service Hub</span></a><span class="header-label">Enterprise services</span><span class="avatar" aria-label="Demo user Alex Morgan">AM</span></header>
  <main id="main">
    <section class="hero"><span class="eyebrow">YOUR DIGITAL WORKPLACE</span><h1>Great work starts<br>with the right tools<span class="magenta">.</span></h1><p>One place for the services that keep your business moving.</p><div class="hero-meta"><span class="live-dot"></span> Built for your team <span class="divider">/</span> Powered by possibility</div></section>
    <section class="catalog" aria-labelledby="catalog-title"><div class="section-heading"><div><span class="eyebrow">EXPLORE & CONNECT</span><h2 id="catalog-title">Our services</h2></div><span class="catalog-count">${stage ? '6 services' : 'Coming soon'}</span></div>
    ${stage === 2 ? `<div class="toolbar"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search services…" aria-label="Search services"></label><div class="filters" aria-label="Filter by category">${['All', 'Infrastructure', 'Security', 'Data'].map(c => `<button type="button" data-filter="${c}" aria-pressed="${c === 'All'}">${c}</button>`).join('')}</div></div><p id="result-count" class="result-count" aria-live="polite">6 services found</p>` : ''}
    ${stage ? `<div class="service-grid">${cards}</div>` : '<div class="placeholder"><span class="placeholder-symbol">+</span><h3>A better way to discover services.</h3><p>Our service catalog is taking shape. Check back soon.</p></div>'}
    ${stage === 2 ? '<div id="empty-state" class="placeholder" hidden><h3>No services found</h3><p>Try another search or explore a different category.</p><button id="clear-filters" type="button">Clear filters</button></div>' : ''}
    </section><footer><span><strong>T</strong> Systems that move you forward.</span><span>Service Hub · Presentation demo</span></footer>
  </main>
</body></html>
`;
  const css = `:root{font-family:Inter,Segoe UI,Arial,sans-serif;color:#23232b;background:#f7f7fa;font-synthesis:none}*{box-sizing:border-box}body{margin:0}button,input{font:inherit}button,a,input{-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #e20074;outline-offset:4px}[hidden]{display:none!important}.site-header{height:88px;padding:0 6%;display:flex;align-items:center;gap:24px;background:white;border-bottom:1px solid #e8e8ee}.brand{display:flex;align-items:center;gap:15px;color:inherit;text-decoration:none;font-weight:650;font-size:19px}.brand-mark{display:grid;place-items:center;width:42px;height:44px;background:#e20074;color:white;font-size:35px;font-weight:800}.header-label{margin-left:auto;font-size:13px;color:#686875}.avatar{display:grid;place-items:center;width:35px;height:35px;border-radius:50%;background:#f6e9f0;font-size:11px;color:#a80057;font-weight:700}main{max-width:1250px;margin:auto;padding:0 6%}.hero{padding:76px 0 62px;border-bottom:1px solid #e1e1e8}.eyebrow{font-size:10px;font-weight:750;letter-spacing:2px;color:#8c486b}h1{font-size:clamp(34px,4.2vw,56px);line-height:1.1;letter-spacing:-2px;font-weight:650;margin:22px 0}h1 .magenta{color:#e20074}.hero>p{font-size:16px;color:#6d6d78;line-height:1.6}.hero-meta{display:flex;align-items:center;gap:10px;font-size:11px;color:#757581;margin-top:28px}.live-dot{width:6px;height:6px;border-radius:50%;background:#e20074}.divider{color:#c0c0c9;padding:0 5px}.catalog{padding:36px 0 50px}.section-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}h2{font-size:25px;letter-spacing:-.7px;margin:8px 0 0;font-weight:650}.catalog-count{font-size:11px;color:#737381}.placeholder{padding:54px 20px;text-align:center;border:1px dashed #d6d6df;border-radius:10px;background:#fff}.placeholder-symbol{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;color:#e20074;background:#fff0f7;font-size:25px}.placeholder h3{font-size:16px;font-weight:600}.placeholder p{color:#767682;font-size:13px}footer{padding:25px 0 30px;border-top:1px solid #e1e1e8;display:flex;justify-content:space-between;gap:15px;color:#858591;font-size:10px}footer strong{color:#e20074;font-size:18px;margin-right:10px}@media(max-width:600px){.header-label{display:none}.avatar{margin-left:auto}.hero{padding:42px 0}.hero-meta{flex-wrap:wrap}footer{flex-direction:column}}
${stage ? `.service-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.service-card{background:white;border:1px solid #e5e5ed;border-radius:9px;padding:23px;transition:border-color .15s,transform .15s}.service-card:hover{border-color:#e20074;transform:translateY(-2px)}.card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:25px;gap:8px}.service-number{font-size:15px;font-weight:650;color:#c60066;background:#fff0f7;border-radius:7px;padding:9px 10px}.status{font-size:9px;color:#276a52;background:#edf7f1;padding:5px 7px;border-radius:20px}.status.maintenance{color:#805e16;background:#fff6de}.category{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#8b8b97}.service-card h3{font-size:16px;margin:9px 0;font-weight:650;letter-spacing:-.3px}.service-card p{font-size:12px;line-height:1.7;color:#757580;margin:0;min-height:42px}.card-foot{border-top:1px solid #f0f0f5;margin-top:22px;padding-top:14px;display:flex;justify-content:space-between;color:#898994;font-size:10px}.card-foot span{color:#e20074;font-size:15px}@media(max-width:850px){.service-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.service-grid{grid-template-columns:1fr}}
` : ''}${stage === 2 ? `.toolbar{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}.search{display:flex;gap:10px;align-items:center;background:white;border:1px solid #dddde6;border-radius:6px;padding:10px 13px;flex:1;min-width:180px;max-width:320px}.search>span{font-size:22px;line-height:1;color:#a4a4ad}.search input{width:100%;border:0;outline-offset:5px;font-size:12px;background:transparent;color:inherit}.filters{display:flex;flex-wrap:wrap;gap:5px}.filters button,#clear-filters{cursor:pointer;border:1px solid #e0e0e8;border-radius:5px;background:white;color:#70707c;font-size:11px;padding:9px 12px}.filters button[aria-pressed=true]{background:#e20074;border-color:#e20074;color:white}.result-count{font-size:11px;color:#888894;margin:20px 0 14px}#clear-filters{color:#c00064;border-color:#e20074;margin-top:10px}
` : ''}`;
  const js = stage < 2 ? "'use strict';\n// Service Hub: no interactive controls yet.\n" : `'use strict';
const search = document.querySelector('#search');
const buttons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.service-card')];
let category = 'All';
function filterServices() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  for (const card of cards) {
    const matches = (category === 'All' || card.dataset.category === category) && card.textContent.toLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) count++;
  }
  document.querySelector('#result-count').textContent = count + (count === 1 ? ' service found' : ' services found');
  document.querySelector('#empty-state').hidden = count !== 0;
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
}
search.addEventListener('input', filterServices);
for (const button of buttons) button.addEventListener('click', () => { category = button.dataset.filter; filterServices(); });
document.querySelector('#clear-filters').addEventListener('click', () => { search.value = ''; category = 'All'; filterServices(); search.focus(); });
filterServices();
`;
  return { 'index.html': html.replace(/[\t ]+$/gm, ''), 'styles.css': css, 'app.js': js };
}
module.exports = { snapshot, tickets };
