/* ═══════════════════════════════════════════════
   NOON GC INC. — App Logic
═══════════════════════════════════════════════ */

let lang = 'fr';
let itemCounters = { q: 1, i: 1 };

/* ─── Language ─── */
function toggleLanguage() {
  lang = lang === 'fr' ? 'en' : 'fr';
  document.documentElement.setAttribute('data-lang', lang);
  document.getElementById('langLabel').textContent = lang.toUpperCase();
  document.getElementById('langOther').textContent = lang === 'fr' ? 'EN' : 'FR';
  applyTranslations();
  applyStoredContent();
  renderServices();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (T[lang][key] !== undefined) {
      el.innerHTML = T[lang][key];
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (T[lang][key]) el.placeholder = T[lang][key];
  });
}

/* ─── Mobile Menu ─── */
function toggleMenu() {
  const links = document.getElementById('navLinks');
  const ham   = document.getElementById('hamburger');
  links.classList.toggle('open');
  ham.classList.toggle('open');
}

/* Close menu on link click */
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
  });
});

/* ─── Sticky Navbar ─── */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ─── Scroll Reveal ─── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ─── Services Grid ─── */
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  const list = SERVICES[lang];
  grid.innerHTML = list.map((s, i) => `
    <div class="srv-card reveal" style="transition-delay:${i * 0.06}s">
      <div class="srv-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');
  initReveal();
}

/* ─── Form Items ─── */
function addItem(prefix) {
  itemCounters[prefix]++;
  const n = itemCounters[prefix];
  const container = document.getElementById(`${prefix}-items`);
  const row = document.createElement('div');
  row.className = 'item-row';
  row.id = `${prefix}-item-${n}`;
  row.innerHTML = `
    <input type="text"   class="item-desc"  placeholder="${lang === 'fr' ? 'Description des travaux...' : 'Work description...'}">
    <input type="number" class="item-qty"   placeholder="1"    min="0" step="1"    value="1"  oninput="calcTotals('${prefix}')">
    <input type="number" class="item-price" placeholder="0.00" min="0" step="0.01" value=""   oninput="calcTotals('${prefix}')">
    <span class="item-total-display" id="${prefix}-itot-${n}">$0.00</span>
    <button class="btn-del" onclick="removeItem(this, '${prefix}')"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(row);
}

function removeItem(btn, prefix) {
  const row = btn.closest('.item-row');
  row.remove();
  calcTotals(prefix);
}

function calcTotals(prefix) {
  const container = document.getElementById(`${prefix}-items`);
  const rows = container.querySelectorAll('.item-row');
  let subtotal = 0;
  rows.forEach((row, idx) => {
    const qty   = parseFloat(row.querySelector('.item-qty')?.value)   || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    const line  = qty * price;
    subtotal += line;
    const display = row.querySelector('.item-total-display');
    if (display) display.textContent = `$${line.toFixed(2)}`;
  });
  const gst  = subtotal * 0.05;
  const qst  = subtotal * 0.09975;
  const total = subtotal + gst + qst;
  document.getElementById(`${prefix}-sub`).textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById(`${prefix}-gst`).textContent = `$${gst.toFixed(2)}`;
  document.getElementById(`${prefix}-qst`).textContent = `$${qst.toFixed(2)}`;
  document.getElementById(`${prefix}-tot`).textContent = `$${total.toFixed(2)}`;
}

function getItems(prefix) {
  const container = document.getElementById(`${prefix}-items`);
  const rows = container.querySelectorAll('.item-row');
  return Array.from(rows).map((row, i) => ({
    num:   i + 1,
    desc:  row.querySelector('.item-desc')?.value  || '',
    qty:   parseFloat(row.querySelector('.item-qty')?.value)   || 1,
    price: parseFloat(row.querySelector('.item-price')?.value) || 0,
    total: (parseFloat(row.querySelector('.item-qty')?.value) || 1) *
           (parseFloat(row.querySelector('.item-price')?.value) || 0)
  }));
}

/* ─── WhatsApp Share ─── */
function whatsappShare(type) {
  const isQuote = type === 'quote';
  const prefix  = isQuote ? 'q' : 'i';
  const name    = document.getElementById(`${prefix}-name`)?.value || '—';
  const addr    = document.getElementById(`${prefix}-addr`)?.value || '—';
  const tot     = document.getElementById(`${prefix}-tot`)?.textContent || '$0.00';
  const num     = document.getElementById(`${prefix}-num`)?.value  || '—';

  const docType = isQuote
    ? (lang === 'fr' ? 'Devis' : 'Estimate')
    : (lang === 'fr' ? 'Facture' : 'Invoice');

  const msg = lang === 'fr'
    ? `Bonjour,\n\nVeuillez trouver ci-joint votre *${docType} N° ${num}*.\n\n👤 Client: ${name}\n📍 Adresse: ${addr}\n💰 Total: ${tot}\n\n✅ Merci de votre confiance — NOON GC INC.\n📞 514 651-5159`
    : `Hello,\n\nPlease find attached your *${docType} # ${num}*.\n\n👤 Client: ${name}\n📍 Address: ${addr}\n💰 Total: ${tot}\n\n✅ Thank you for your business — NOON GC INC.\n📞 514 651-5159`;

  generatePDF(type);

  setTimeout(() => {
    window.open(`https://wa.me/15146515159?text=${encodeURIComponent(msg)}`, '_blank');
  }, 800);
}

/* ─── Devis Modal ─── */
function openDevisModal() {
  document.getElementById('devisModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeDevisModal() {
  document.getElementById('devisModal').style.display = 'none';
  document.body.style.overflow = '';
}

function collectDevisForm() {
  const name   = document.getElementById('dv-name')?.value.trim();
  const phone  = document.getElementById('dv-phone')?.value.trim();
  const addr   = document.getElementById('dv-addr')?.value.trim();
  const email  = document.getElementById('dv-email')?.value.trim();
  const desc   = document.getElementById('dv-desc')?.value.trim();
  const avail  = document.getElementById('dv-avail')?.value.trim();
  const urgent = document.querySelector('input[name="dv-urgent"]:checked')?.value || 'Non';
  const types  = Array.from(document.querySelectorAll('#dv-types input:checked')).map(c => c.value);

  const err = document.getElementById('dv-error');
  if (!name || !phone || !addr || types.length === 0 || !desc) {
    err.style.display = 'flex';
    return null;
  }
  err.style.display = 'none';
  return { name, phone, email, addr, types, desc, avail, urgent };
}

function buildMessage(d, isFr) {
  const sep = '─────────────────────';
  const typesList = d.types.join(', ');
  if (isFr) {
    return `🔧 *DEMANDE DE DEVIS — NOON GC INC.*\n${sep}\n\n` +
      `👤 *Nom :* ${d.name}\n` +
      `📞 *Téléphone :* ${d.phone}\n` +
      (d.email ? `📧 *Courriel :* ${d.email}\n` : '') +
      `📍 *Adresse des travaux :* ${d.addr}\n\n` +
      `🔧 *Type de travail :* ${typesList}\n` +
      `📝 *Description :* ${d.desc}\n` +
      (d.avail ? `📅 *Disponibilité :* ${d.avail}\n` : '') +
      `🚨 *Urgence :* ${d.urgent}\n\n` +
      `${sep}\n_Envoyé depuis le site NOON GC INC._`;
  } else {
    return `🔧 *QUOTE REQUEST — NOON GC INC.*\n${sep}\n\n` +
      `👤 *Name:* ${d.name}\n` +
      `📞 *Phone:* ${d.phone}\n` +
      (d.email ? `📧 *Email:* ${d.email}\n` : '') +
      `📍 *Work address:* ${d.addr}\n\n` +
      `🔧 *Type of work:* ${typesList}\n` +
      `📝 *Description:* ${d.desc}\n` +
      (d.avail ? `📅 *Availability:* ${d.avail}\n` : '') +
      `🚨 *Emergency:* ${d.urgent}\n\n` +
      `${sep}\n_Sent from NOON GC INC. website_`;
  }
}

function sendDevisWA() {
  const d = collectDevisForm();
  if (!d) return;
  const msg = buildMessage(d, lang === 'fr');
  window.open(`https://wa.me/15149987787?text=${encodeURIComponent(msg)}`, '_blank');
  closeDevisModal();
}

function sendDevisEmail() {
  const d = collectDevisForm();
  if (!d) return;
  const subject = lang === 'fr'
    ? `Demande de Devis — ${d.name}`
    : `Quote Request — ${d.name}`;
  const body = buildMessage(d, lang === 'fr').replace(/\*/g, '').replace(/_/g, '');
  window.location.href = `mailto:mahmudsanad@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  closeDevisModal();
}

/* ─── Google Font loader ─── */
function loadGoogleFont(name) {
  const id = 'gfont-' + name.replace(/\s+/g, '-');
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id   = id;
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

/* ─── Apply stored typography from Admin ─── */
function applyStoredTypography() {
  try {
    const t = JSON.parse(localStorage.getItem('noon_typography') || '{}');
    const root = document.documentElement;
    if (t.bodyFont) {
      loadGoogleFont(t.bodyFont);
      root.style.setProperty('--font-body', `'${t.bodyFont}', sans-serif`);
    }
    if (t.headingFont) {
      loadGoogleFont(t.headingFont);
      root.style.setProperty('--font-heading', `'${t.headingFont}', sans-serif`);
    }
    if (t.fontSize) {
      root.style.fontSize = t.fontSize + 'px';
    }
  } catch(e) {}
}

/* ─── Apply stored images from Admin ─── */
function applyStoredImages() {
  const imgAbout = localStorage.getItem('noon_img_about');
  if (imgAbout) {
    const photo = document.getElementById('aboutPhoto');
    const wrap  = document.getElementById('aboutPhotoWrap');
    const card  = document.getElementById('aboutCard');
    if (photo) photo.src = imgAbout;
    if (wrap)  wrap.style.display = 'block';
    if (card)  card.style.display = 'none';
  }
}

/* ─── Apply stored text content from Admin ─── */
function applyStoredContent() {
  try {
    const s = JSON.parse(localStorage.getItem('noon_site_settings') || '{}');
    if (!s.about) return;
    const a = s.about;
    // Name
    if (a.name) {
      ['aboutNameCard', 'aboutNamePhoto'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = a.name;
      });
    }
    // Lang-sensitive fields
    const sfx = '_' + lang;
    if (a['title' + sfx])     document.querySelectorAll('[data-i18n="about.jobtitle"]').forEach(el => { el.textContent = a['title' + sfx]; });
    if (a['mainTitle' + sfx]) { const el = document.getElementById('aboutTitle'); if (el) el.textContent = a['mainTitle' + sfx]; }
    if (a['p1' + sfx])        { const el = document.getElementById('about-p1');  if (el) el.innerHTML  = a['p1' + sfx]; }
    if (a['p2' + sfx])        { const el = document.getElementById('about-p2');  if (el) el.innerHTML  = a['p2' + sfx]; }
  } catch(e) {}
}

/* ─── Set today's date by default ─── */
function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  ['q-date', 'i-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

/* ─── Add first item rows ─── */
function initItemRows() {
  ['q', 'i'].forEach(prefix => {
    const container = document.getElementById(`${prefix}-items`);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = `${prefix}-item-1`;
    row.innerHTML = `
      <input type="text"   class="item-desc"  placeholder="${lang === 'fr' ? 'Description des travaux...' : 'Work description...'}">
      <input type="number" class="item-qty"   placeholder="1"    min="0" step="1"    value="1"  oninput="calcTotals('${prefix}')">
      <input type="number" class="item-price" placeholder="0.00" min="0" step="0.01" value=""   oninput="calcTotals('${prefix}')">
      <span class="item-total-display" id="${prefix}-itot-1">$0.00</span>
      <button class="btn-del" onclick="removeItem(this, '${prefix}')"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(row);
  });
}

/* ─── Reveal on scroll ─── */
function addRevealClasses() {
  document.querySelectorAll('.section-head, .doc-card, .about-grid, .wa-banner, .contact-card, .contact-grid').forEach(el => {
    el.classList.add('reveal');
  });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  applyStoredTypography();
  applyTranslations();
  applyStoredContent();
  applyStoredImages();
  renderServices();
  setDefaultDates();
  initItemRows();
  addRevealClasses();
  initReveal();
});
