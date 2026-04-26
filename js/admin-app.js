/* ═══════════════════════════════════════════════════
   NOON GC INC. — Admin Dashboard Logic
   Password default: Noon@2026
═══════════════════════════════════════════════════ */

const DEFAULT_PWD = 'Noon@2026';
const STORAGE_KEY = 'noon_jobs';
const SETTINGS_KEY = 'noon_site_settings';
const AUTH_KEY = 'noon_auth';

let currentView = 'dashboard';
let editingJobId = null;
let itemCounters = { d: 1, f: 1 };

/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
function getStoredPwd() {
  return localStorage.getItem('noon_password') || DEFAULT_PWD;
}

function doLogin() {
  const input = document.getElementById('loginPwd').value;
  if (input === getStoredPwd()) {
    sessionStorage.setItem(AUTH_KEY, 'ok');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'flex';
    initDashboard();
  } else {
    document.getElementById('loginError').style.display = 'flex';
    document.getElementById('loginPwd').value = '';
    document.getElementById('loginPwd').focus();
  }
}

function doLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
}

function togglePwd() {
  const input = document.getElementById('loginPwd');
  const icon  = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text'; icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password'; icon.className = 'fas fa-eye';
  }
}

function changePassword() {
  const cur     = document.getElementById('set-pwd-cur').value;
  const nw      = document.getElementById('set-pwd-new').value;
  const confirm = document.getElementById('set-pwd-confirm').value;
  const msg     = document.getElementById('pwd-msg');

  if (cur !== getStoredPwd()) {
    msg.style.color = '#ef4444'; msg.textContent = '✗ Mot de passe actuel incorrect';
    return;
  }
  if (nw.length < 6) {
    msg.style.color = '#ef4444'; msg.textContent = '✗ Minimum 6 caractères';
    return;
  }
  if (nw !== confirm) {
    msg.style.color = '#ef4444'; msg.textContent = '✗ Les mots de passe ne correspondent pas';
    return;
  }
  localStorage.setItem('noon_password', nw);
  msg.style.color = '#10b981'; msg.textContent = '✓ Mot de passe modifié avec succès';
  document.getElementById('set-pwd-cur').value = '';
  document.getElementById('set-pwd-new').value = '';
  document.getElementById('set-pwd-confirm').value = '';
}

/* ══════════════════════════════════
   DATA LAYER
══════════════════════════════════ */
function getJobs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function addJob(job) {
  const jobs = getJobs();
  job.id = generateId();
  job.createdAt = new Date().toISOString();
  jobs.unshift(job);
  saveJobs(jobs);
  return job;
}

function updateJobStatus(id, status) {
  const jobs = getJobs();
  const j = jobs.find(x => x.id === id);
  if (j) { j.status = status; saveJobs(jobs); }
}

function deleteJob(id) {
  saveJobs(getJobs().filter(j => j.id !== id));
}

/* ══════════════════════════════════
   NAVIGATION
══════════════════════════════════ */
const VIEW_TITLES = {
  dashboard:  'Tableau de bord',
  newDevis:   'Nouveau Devis',
  newFacture: 'Nouvelle Facture',
  jobs:       'Tous les Travaux',
  editor:     'Éditeur du Site',
  settings:   'Paramètres',
};

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(b => b.classList.remove('active'));

  const el = document.getElementById(`view-${name}`);
  if (el) el.classList.add('active');

  const btn = document.querySelector(`[data-view="${name}"]`);
  if (btn) btn.classList.add('active');

  document.getElementById('topbarTitle').textContent = VIEW_TITLES[name] || name;
  currentView = name;

  if (name === 'dashboard')  renderDashboard();
  if (name === 'newDevis')   renderDocForm('d');
  if (name === 'newFacture') renderDocForm('f');
  if (name === 'jobs')       renderJobsList();
  if (name === 'editor')     renderEditor();
  if (name === 'settings')   renderSettings();

  // close sidebar on mobile
  if (window.innerWidth < 900) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function renderDashboard() {
  const jobs = getJobs();
  const devis   = jobs.filter(j => j.type === 'devis');
  const factures = jobs.filter(j => j.type === 'facture');
  const totalRev = factures.filter(j => j.status === 'paid').reduce((s, j) => s + (j.total || 0), 0);
  const pending  = factures.filter(j => j.status === 'pending').length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon" style="background:#dbeafe;color:#3b82f6"><i class="fas fa-file-alt"></i></div>
      <div class="stat-info">
        <div class="stat-val">${devis.length}</div>
        <div class="stat-lbl">Devis émis</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fef3c7;color:#f59e0b"><i class="fas fa-file-invoice-dollar"></i></div>
      <div class="stat-info">
        <div class="stat-val">${factures.length}</div>
        <div class="stat-lbl">Factures émises</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#d1fae5;color:#10b981"><i class="fas fa-dollar-sign"></i></div>
      <div class="stat-info">
        <div class="stat-val">$${totalRev.toFixed(0)}</div>
        <div class="stat-lbl">Revenus encaissés</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fee2e2;color:#ef4444"><i class="fas fa-clock"></i></div>
      <div class="stat-info">
        <div class="stat-val">${pending}</div>
        <div class="stat-lbl">Paiements en attente</div>
      </div>
    </div>
  `;

  const recent = jobs.slice(0, 6);
  if (recent.length === 0) {
    document.getElementById('recentJobs').innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i>Aucun travail enregistré</div>`;
    return;
  }
  document.getElementById('recentJobs').innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Type</th><th>N°</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th><th></th>
      </tr></thead>
      <tbody>${recent.map(j => jobRow(j)).join('')}</tbody>
    </table>
  `;
}

/* ══════════════════════════════════
   JOBS LIST
══════════════════════════════════ */
function renderJobsList() {
  let jobs = getJobs();
  const filter = document.getElementById('jobFilter')?.value || 'all';
  const search = (document.getElementById('jobSearch')?.value || '').toLowerCase();

  if (filter === 'devis')   jobs = jobs.filter(j => j.type === 'devis');
  if (filter === 'facture') jobs = jobs.filter(j => j.type === 'facture');
  if (filter === 'pending') jobs = jobs.filter(j => j.status === 'pending');
  if (filter === 'paid')    jobs = jobs.filter(j => j.status === 'paid');
  if (search) jobs = jobs.filter(j => j.clientName?.toLowerCase().includes(search));

  const el = document.getElementById('jobsList');
  if (!el) return;
  if (jobs.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i>Aucun résultat</div>`;
    return;
  }
  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Type</th><th>N°</th><th>Client</th><th>Adresse</th><th>Date</th><th>Total</th><th>Statut</th><th>Actions</th>
      </tr></thead>
      <tbody>${jobs.map(j => jobRow(j, true)).join('')}</tbody>
    </table>
  `;
}

function jobRow(j, showAddr = false) {
  const typeB = j.type === 'devis'
    ? `<span class="badge badge-devis"><i class="fas fa-file-alt"></i> Devis</span>`
    : `<span class="badge badge-facture"><i class="fas fa-file-invoice-dollar"></i> Facture</span>`;
  const stMap = { pending:'badge-pending', paid:'badge-paid', cancelled:'badge-cancelled', accepted:'badge-accepted' };
  const stLabel = { pending:'En attente', paid:'Payé', cancelled:'Annulé', accepted:'Accepté' };
  const statusB = `<span class="badge ${stMap[j.status] || 'badge-pending'}">${stLabel[j.status] || 'En attente'}</span>`;
  const date = j.date ? new Date(j.date+'T00:00:00').toLocaleDateString('fr-CA') : '—';
  const addrTd = showAddr ? `<td style="font-size:.78rem;color:#666;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${j.clientAddr||'—'}</td>` : '';

  return `<tr>
    <td>${typeB}</td>
    <td><strong>${j.docNum||'—'}</strong></td>
    <td><strong>${j.clientName||'—'}</strong><br><span style="font-size:.75rem;color:#666">${j.clientPhone||''}</span></td>
    ${addrTd}
    <td>${date}</td>
    <td><strong>$${(j.total||0).toFixed(2)}</strong></td>
    <td>
      <select class="status-select" onchange="updateJobStatus('${j.id}', this.value); renderDashboard()">
        <option value="pending"   ${j.status==='pending'   ?'selected':''}>En attente</option>
        <option value="accepted"  ${j.status==='accepted'  ?'selected':''}>Accepté</option>
        <option value="paid"      ${j.status==='paid'      ?'selected':''}>Payé</option>
        <option value="cancelled" ${j.status==='cancelled' ?'selected':''}>Annulé</option>
      </select>
    </td>
    <td>
      <button class="btn-icon" style="background:#dbeafe;color:#3b82f6" title="Voir" onclick="openJobModal('${j.id}')"><i class="fas fa-eye"></i></button>
    </td>
  </tr>`;
}

/* ══════════════════════════════════
   JOB MODAL
══════════════════════════════════ */
function openJobModal(id) {
  const j = getJobs().find(x => x.id === id);
  if (!j) return;
  editingJobId = id;
  const typeLabel = j.type === 'devis' ? 'Devis' : 'Facture';
  document.getElementById('modalTitle').textContent = `${typeLabel} N° ${j.docNum||'—'} — ${j.clientName||'—'}`;

  const rows = (j.items||[]).map((it,i) =>
    `<tr><td>${i+1}</td><td>${it.desc}</td><td>${it.qty}</td><td>$${it.price.toFixed(2)}</td><td>$${it.total.toFixed(2)}</td></tr>`
  ).join('');

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail-row"><span>Type</span><span>${typeLabel}</span></div>
    <div class="modal-detail-row"><span>Numéro</span><span>${j.docNum||'—'}</span></div>
    ${j.contractNum ? `<div class="modal-detail-row"><span>N° Contrat</span><span>${j.contractNum}</span></div>` : ''}
    <div class="modal-detail-row"><span>Date</span><span>${j.date ? new Date(j.date+'T00:00:00').toLocaleDateString('fr-CA',{year:'numeric',month:'long',day:'numeric'}) : '—'}</span></div>
    <div class="modal-detail-row"><span>Client</span><span>${j.clientName||'—'}</span></div>
    <div class="modal-detail-row"><span>Téléphone</span><span>${j.clientPhone||'—'}</span></div>
    <div class="modal-detail-row"><span>Adresse</span><span>${j.clientAddr||'—'}</span></div>
    <table class="admin-table" style="margin:1rem 0">
      <thead><tr><th>#</th><th>Description</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#666">—</td></tr>'}</tbody>
    </table>
    <div class="modal-detail-row"><span>Sous-total</span><span>$${(j.subtotal||0).toFixed(2)}</span></div>
    <div class="modal-detail-row"><span>TPS/GST (5%)</span><span>$${(j.gst||0).toFixed(2)}</span></div>
    <div class="modal-detail-row"><span>TVQ/QST (9.975%)</span><span>$${(j.qst||0).toFixed(2)}</span></div>
    <div class="modal-detail-row" style="font-weight:700;font-size:1rem"><span>TOTAL</span><span style="color:#0D1B2A">$${(j.total||0).toFixed(2)}</span></div>
    ${j.notes ? `<div style="margin-top:.75rem;padding:.75rem;background:#f4f6f9;border-radius:8px;font-size:.82rem;color:#555">${j.notes}</div>` : ''}
  `;

  document.getElementById('modalPDFBtn').onclick = () => { generatePDFFromJob(j); };
  document.getElementById('modalWABtn').onclick  = () => { shareJobWhatsApp(j); };
  document.getElementById('modalDeleteBtn').onclick = () => {
    if (confirm(`Supprimer ce ${typeLabel} ?`)) {
      deleteJob(id); closeModal();
      renderDashboard(); renderJobsList();
      showToast('Travail supprimé');
    }
  };
  document.getElementById('jobModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('jobModal').style.display = 'none';
  editingJobId = null;
}

/* ══════════════════════════════════
   DOC FORM (DEVIS / FACTURE)
══════════════════════════════════ */
function renderDocForm(prefix) {
  const isFacture = prefix === 'f';
  const containerId = isFacture ? 'factureForm' : 'devisForm';
  const el = document.getElementById(containerId);
  if (!el) return;
  itemCounters[prefix] = 0;

  const today = new Date().toISOString().split('T')[0];
  const jobs = getJobs();
  const nextNum = isFacture
    ? `2026.${String(jobs.filter(j=>j.type==='facture').length + 1).padStart(2,'0')}`
    : `2026.${String(jobs.filter(j=>j.type==='devis').length + 1).padStart(2,'0')}`;

  el.innerHTML = `
    <div class="doc-form">
      <div class="doc-form-section"><i class="fas fa-user-tie"></i> Informations Client</div>
      <div class="form-row-2">
        <div class="fg"><label>Nom du Client</label><input type="text" id="${prefix}-name" placeholder="Jean Dupont"></div>
        <div class="fg"><label>Téléphone</label><input type="tel" id="${prefix}-phone" placeholder="514 000-0000"></div>
      </div>
      <div class="fg"><label>Adresse des Travaux</label><input type="text" id="${prefix}-addr" placeholder="123 Rue Exemple, Montréal, QC H1A 1A1"></div>
      <div class="form-row-${isFacture ? '3' : '2'}">
        <div class="fg"><label>Date</label><input type="date" id="${prefix}-date" value="${today}"></div>
        <div class="fg"><label>${isFacture ? 'N° Facture' : 'N° Devis'}</label><input type="text" id="${prefix}-num" value="${nextNum}"></div>
        ${isFacture ? `<div class="fg"><label>N° Contrat</label><input type="text" id="${prefix}-contract" placeholder="46123.00"></div>` : ''}
      </div>

      <div class="doc-form-section" style="margin-top:1.25rem"><i class="fas fa-tools"></i> Description des Travaux</div>
      <div class="items-hdr">
        <span>Description</span><span style="text-align:right">Qté</span>
        <span style="text-align:right">Prix unit.</span><span style="text-align:right">Total</span><span></span>
      </div>
      <div id="${prefix}-items"></div>
      <button class="btn-add-item" onclick="addDocItem('${prefix}')">
        <i class="fas fa-plus-circle"></i> Ajouter une ligne
      </button>

      <div class="fg" style="margin-top:1rem">
        <label>Notes / Remarques</label>
        <textarea id="${prefix}-notes" rows="2" placeholder="${isFacture ? 'Paiement Interac au 514 651-5159 ou mahmudsanad@icloud.com' : 'Conditions de paiement, délais...'}"></textarea>
      </div>

      <div class="totals-box">
        <div class="trow"><span>Sous-total</span><span id="${prefix}-sub">$0.00</span></div>
        <div class="trow"><span>TPS / GST (5%)</span><span id="${prefix}-gst">$0.00</span></div>
        <div class="trow"><span>TVQ / QST (9.975%)</span><span id="${prefix}-qst">$0.00</span></div>
        <div class="trow trow-total"><span>TOTAL</span><span id="${prefix}-tot">$0.00</span></div>
      </div>

      <div class="form-actions">
        <button class="btn-act btn-gold" onclick="saveAndGeneratePDF('${prefix}')">
          <i class="fas fa-file-pdf"></i> Enregistrer &amp; PDF
        </button>
        <button class="btn-act btn-wa" onclick="saveAndWhatsApp('${prefix}')">
          <i class="fab fa-whatsapp"></i> Enregistrer &amp; WhatsApp
        </button>
        <button class="btn-act btn-navy" onclick="saveDocOnly('${prefix}')">
          <i class="fas fa-save"></i> Enregistrer seulement
        </button>
      </div>
    </div>
  `;
  addDocItem(prefix);
}

function addDocItem(prefix) {
  itemCounters[prefix]++;
  const n = itemCounters[prefix];
  const container = document.getElementById(`${prefix}-items`);
  const row = document.createElement('div');
  row.className = 'item-row';
  row.id = `${prefix}-item-${n}`;
  row.innerHTML = `
    <input type="text"   class="item-desc"  placeholder="Description...">
    <input type="number" class="item-qty"   value="1" min="0" step="1" style="text-align:right" oninput="calcDocTotals('${prefix}')">
    <input type="number" class="item-price" value="" min="0" step="0.01" style="text-align:right" placeholder="0.00" oninput="calcDocTotals('${prefix}')">
    <span class="item-tot" id="${prefix}-itot-${n}">$0.00</span>
    <button class="btn-del" onclick="this.closest('.item-row').remove();calcDocTotals('${prefix}')"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(row);
}

function calcDocTotals(prefix) {
  let sub = 0;
  document.querySelectorAll(`#${prefix}-items .item-row`).forEach((row, i) => {
    const qty   = parseFloat(row.querySelector('.item-qty')?.value)   || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    const line  = qty * price;
    sub += line;
    const disp = row.querySelector('.item-tot');
    if (disp) disp.textContent = `$${line.toFixed(2)}`;
  });
  const gst = sub * 0.05;
  const qst = sub * 0.09975;
  document.getElementById(`${prefix}-sub`).textContent = `$${sub.toFixed(2)}`;
  document.getElementById(`${prefix}-gst`).textContent = `$${gst.toFixed(2)}`;
  document.getElementById(`${prefix}-qst`).textContent = `$${qst.toFixed(2)}`;
  document.getElementById(`${prefix}-tot`).textContent = `$${(sub+gst+qst).toFixed(2)}`;
}

function collectDocData(prefix) {
  const isFacture = prefix === 'f';
  const items = [];
  document.querySelectorAll(`#${prefix}-items .item-row`).forEach((row, i) => {
    const qty   = parseFloat(row.querySelector('.item-qty')?.value)   || 1;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    items.push({
      num: i + 1,
      desc:  row.querySelector('.item-desc')?.value.trim() || '',
      qty, price, total: qty * price
    });
  });
  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const gst      = subtotal * 0.05;
  const qst      = subtotal * 0.09975;
  return {
    type:        isFacture ? 'facture' : 'devis',
    clientName:  document.getElementById(`${prefix}-name`)?.value.trim()     || '',
    clientPhone: document.getElementById(`${prefix}-phone`)?.value.trim()    || '',
    clientAddr:  document.getElementById(`${prefix}-addr`)?.value.trim()     || '',
    date:        document.getElementById(`${prefix}-date`)?.value            || '',
    docNum:      document.getElementById(`${prefix}-num`)?.value.trim()      || '',
    contractNum: isFacture ? (document.getElementById(`${prefix}-contract`)?.value.trim() || '') : '',
    notes:       document.getElementById(`${prefix}-notes`)?.value.trim()    || '',
    items, subtotal, gst, qst, total: subtotal + gst + qst,
    status: 'pending'
  };
}

function saveDocOnly(prefix) {
  const data = collectDocData(prefix);
  addJob(data);
  showToast(`${data.type === 'devis' ? 'Devis' : 'Facture'} enregistré(e) avec succès !`);
  renderDocForm(prefix);
}

function saveAndGeneratePDF(prefix) {
  const data = collectDocData(prefix);
  addJob(data);
  generatePDFFromJob(data);
  showToast('Enregistré & PDF téléchargé !');
  renderDocForm(prefix);
}

async function saveAndWhatsApp(prefix) {
  const data = collectDocData(prefix);
  addJob(data);
  await shareJobWhatsApp(data);
  renderDocForm(prefix);
}

/* ══════════════════════════════════
   PDF FROM JOB OBJECT
══════════════════════════════════ */
function generatePDFFromJob(j, returnBlob = false) {
  // Map job object to the format expected by pdf.js generatePDF
  // We directly call the jsPDF code here for admin context
  const { jsPDF } = window.jspdf;
  const isQuote = j.type === 'devis';
  const isFr    = true; // Admin always FR

  const labels = {
    docNumLabel:  isQuote ? 'N° Devis' : 'N° Facture',
    dateLabel:    'Date',
    clientLabel:  'Client',
    addrLabel:    'Adresse des travaux',
    phoneLabel:   'Téléphone',
    contLabel:    'N° Contrat',
    descLabel:    'DESCRIPTION',
    qtyLabel:     'QTÉ',
    unitLabel:    'PRIX UNIT.',
    totalLabel:   'TOTAL',
    subtotalLabel:'Sous-total',
    gstLabel:     'TPS / GST (5%)',
    qstLabel:     'TVQ / QST (9.975%)',
    grandTotal:   'TOTAL',
    notesLabel:   'Notes / Remarques',
    thanksLabel:  'MERCI POUR VOTRE CONFIANCE !',
    paymentNote:  'Paiement Interac au Tel: 514 651-5159 ou Email: mahmudsanad@icloud.com',
    jobType:      isQuote ? 'DEVIS — TRAVAUX ÉLECTRIQUES' : 'FACTURE — TRAVAUX ÉLECTRIQUES',
    docType:      isQuote ? 'DEVIS / ESTIMATE' : 'FACTURE / INVOICE',
  };

  let displayDate = j.date || '';
  if (j.date) {
    const d = new Date(j.date + 'T00:00:00');
    displayDate = d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const navy  = [13, 27, 42];
  const gold  = [244, 196, 48];
  const white = [255, 255, 255];
  const light = [244, 246, 249];
  const gray  = [108, 117, 125];

  let y = 0;

  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 52, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, 52, W, 4, 'F');

  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('NOON GC INC.', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text('Corporation des Maîtres Électriciens du Québec — CMEQ', 14, 26);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7.5);
  doc.text('Sanad Muhmud', 14, 32);
  doc.text('4390 Kingston, Pierrefonds, QC  H9A 2S9', 14, 37);
  doc.text('Tel: 514 651-5159  |  514 998-7787', 14, 42);
  doc.text('mahmudsanad@icloud.com', 14, 47);

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.roundedRect(130, 8, 72, 40, 2, 2, 'S');
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RBQ : 5686-2097', 134, 16);
  doc.text('TPS/GST : 720 366 731 RT 0001', 134, 22);
  doc.text('TVQ/QST : 228 829 681 TQ 0001', 134, 28);
  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Protège le public · Protects the public', 134, 38);

  y = 62;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...navy);
  doc.text(labels.docType, 14, y);

  const infoX = 130;
  doc.setFillColor(...light);
  doc.roundedRect(infoX, y - 8, 72, isQuote ? 30 : 38, 2, 2, 'F');
  let infoY = y - 2;
  const addInfoRow = (label, value) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...navy);
    doc.text(label + ':', infoX + 3, infoY);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
    doc.text(value || '—', infoX + 36, infoY);
    infoY += 7;
  };
  addInfoRow(labels.docNumLabel, j.docNum);
  addInfoRow(labels.dateLabel, displayDate);
  if (!isQuote) addInfoRow(labels.contLabel, j.contractNum);

  doc.setFillColor(...gold);
  doc.roundedRect(14, y + 5, 80, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...navy);
  doc.text(labels.jobType, 16, y + 10);
  y += 22;

  doc.setDrawColor(...gold); doc.setLineWidth(0.5);
  doc.line(14, y, W - 14, y);
  y += 7;

  doc.setFillColor(...light);
  doc.roundedRect(14, y, 90, j.clientAddr ? 28 : 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...gold);
  doc.text('CLIENT', 18, y + 6);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...navy);
  doc.text(j.clientName || '—', 18, y + 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
  if (j.clientPhone) doc.text('Tél: ' + j.clientPhone, 18, y + 19);
  if (j.clientAddr)  doc.text(j.clientAddr, 18, y + 25, { maxWidth: 82 });
  y += (j.clientAddr ? 34 : 28);

  const tableBody = (j.items || []).map(it => [
    it.num, it.desc, it.qty.toString(), `$${it.price.toFixed(2)}`, `$${it.total.toFixed(2)}`
  ]);
  doc.autoTable({
    startY: y,
    head: [[
      { content: '#', styles: { halign: 'center' } },
      labels.descLabel, labels.qtyLabel, labels.unitLabel, labels.totalLabel
    ]],
    body: tableBody.length ? tableBody : [['', 'Aucun article', '', '', '$0.00']],
    theme: 'plain', margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
    headStyles: { fillColor: navy, textColor: gold, fontStyle: 'bold', fontSize: 8, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
    bodyStyles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, textColor: [30, 30, 40] },
    alternateRowStyles: { fillColor: light },
  });

  y = doc.lastAutoTable.finalY + 6;
  const totW = 90; const totX = W - 14 - totW;

  const drawTotRow = (label, value, isBold, bgColor) => {
    if (bgColor) { doc.setFillColor(...bgColor); doc.rect(totX, y, totW, 9, 'F'); }
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 8.5);
    doc.setTextColor(...(isBold ? white : gray));
    if (isBold && bgColor) doc.setTextColor(...white);
    doc.text(label, totX + 4, y + 6.3);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...(isBold ? white : navy));
    doc.text(value, totX + totW - 4, y + 6.3, { align: 'right' });
    y += 9;
  };

  drawTotRow(labels.subtotalLabel, `$${(j.subtotal||0).toFixed(2)}`, false, null);
  doc.line(totX, y, totX + totW, y);
  drawTotRow(labels.gstLabel, `$${(j.gst||0).toFixed(2)}`, false, null);
  drawTotRow(labels.qstLabel, `$${(j.qst||0).toFixed(2)}`, false, null);
  doc.line(totX, y, totX + totW, y); y += 1;
  drawTotRow(labels.grandTotal, `$${(j.total||0).toFixed(2)}`, true, navy);
  y += 8;

  doc.setFillColor(...light);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
  doc.setDrawColor(...gold); doc.setLineWidth(0.4);
  doc.line(14, y, 14, y + 14);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...navy);
  doc.text('Paiement / Payment:', 18, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  doc.text(labels.paymentNote, 18, y + 11);
  y += 20;

  if (j.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...navy);
    doc.text('Notes:', 14, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    const noteLines = doc.splitTextToSize(j.notes, W - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 5;
  }

  const footY = H - 20;
  doc.setFillColor(...navy); doc.rect(0, footY, W, 20, 'F');
  doc.setFillColor(...gold); doc.rect(0, footY, W, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...gold);
  doc.text(labels.thanksLabel, W / 2, footY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(180, 180, 180);
  doc.text('NOON GC INC.  ·  514 651-5159  ·  mahmudsanad@icloud.com  ·  RBQ : 5686-2097', W / 2, footY + 15, { align: 'center' });

  const typeLabel = isQuote ? 'Devis' : 'Facture';
  const filename  = `${typeLabel}_${j.docNum||'NOON'}_${(j.clientName||'Client').replace(/\s+/g,'_')}.pdf`;

  if (returnBlob) return { blob: doc.output('blob'), filename };
  doc.save(filename);
}

/* ── Build WhatsApp message text ── */
function buildWAMsg(j) {
  const typeLabel = j.type === 'devis' ? 'Devis' : 'Facture';
  return `Bonjour *${j.clientName || ''}*,\n\n` +
    `Veuillez trouver ci-joint votre *${typeLabel} N° ${j.docNum || '—'}*.\n\n` +
    `👤 *Client :* ${j.clientName || '—'}\n` +
    `📍 *Adresse :* ${j.clientAddr || '—'}\n` +
    `💰 *Total : $${(j.total || 0).toFixed(2)}*\n\n` +
    `✅ Merci de votre confiance — NOON GC INC.\n` +
    `📞 514 998-7787`;
}

/* ── Share PDF via WhatsApp (native on mobile, download+WA on desktop) ── */
async function shareJobWhatsApp(j) {
  const { blob, filename } = generatePDFFromJob(j, true);
  const msg = buildWAMsg(j);
  const waUrl = `https://wa.me/15149987787?text=${encodeURIComponent(msg)}`;

  // Mobile: try native Web Share API with file
  if (navigator.canShare) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: msg });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled
      }
    }
  }

  // Desktop fallback: download PDF then open WhatsApp
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);

  showToast('📎 PDF téléchargé — joignez le fichier dans WhatsApp');
  setTimeout(() => window.open(waUrl, '_blank'), 1200);
}

/* ══════════════════════════════════
   SITE EDITOR
══════════════════════════════════ */
function renderEditor() {
  const s = getSiteSettings();

  // Hero
  document.getElementById('ed-hero-l1-fr').value  = s.hero?.l1_fr  || 'Votre Électricien';
  document.getElementById('ed-hero-l1-en').value  = s.hero?.l1_en  || 'Your Electrician';
  document.getElementById('ed-hero-l2-fr').value  = s.hero?.l2_fr  || 'Certifié & Fiable';
  document.getElementById('ed-hero-l2-en').value  = s.hero?.l2_en  || 'Certified & Reliable';
  document.getElementById('ed-hero-sub-fr').value = s.hero?.sub_fr || '';
  document.getElementById('ed-hero-sub-en').value = s.hero?.sub_en || '';

  // À Propos
  const a = s.about || {};
  document.getElementById('ed-about-name').value          = a.name           || 'Sanad Muhmud';
  document.getElementById('ed-about-title-fr').value      = a.title_fr       || 'Maître Électricien Certifié';
  document.getElementById('ed-about-title-en').value      = a.title_en       || 'Certified Master Electrician';
  document.getElementById('ed-about-mainTitle-fr').value  = a.mainTitle_fr   || 'Expert en Électricité depuis 20+ Ans';
  document.getElementById('ed-about-mainTitle-en').value  = a.mainTitle_en   || 'Electrical Expert for 20+ Years';
  document.getElementById('ed-about-p1-fr').value         = a.p1_fr          || 'Avec plus de 20 ans d\'expérience dans le domaine de l\'électricité au Québec, NOON GC INC. offre des services professionnels, fiables et certifiés pour tous vos besoins électriques résidentiels et commerciaux.';
  document.getElementById('ed-about-p1-en').value         = a.p1_en          || 'With over 20 years of experience in Quebec\'s electrical field, NOON GC INC. provides professional, reliable, and certified services for all your residential and commercial electrical needs.';
  document.getElementById('ed-about-p2-fr').value         = a.p2_fr          || 'Membre certifié de la Corporation des Maîtres Électriciens du Québec (CMEQ), nous garantissons un travail conforme aux normes en vigueur et à la réglementation québécoise.';
  document.getElementById('ed-about-p2-en').value         = a.p2_en          || 'Certified member of the Corporation des Maîtres Électriciens du Québec (CMEQ), we guarantee work compliant with current standards and Quebec regulations.';

  // Contact
  document.getElementById('ed-phone1').value   = s.contact?.phone1   || '514 651-5159';
  document.getElementById('ed-phone2').value   = s.contact?.phone2   || '514 998-7787';
  document.getElementById('ed-email').value    = s.contact?.email    || 'mahmudsanad@icloud.com';
  document.getElementById('ed-address').value  = s.contact?.address  || '4390 Kingston, Pierrefonds, QC H9A 2S9';

  renderServicesEditor(s);
  renderImagesEditor();
}

function renderServicesEditor(s) {
  const srvFR = s.services_fr || SERVICES.fr;
  const srvEN = s.services_en || SERVICES.en;
  const el = document.getElementById('servicesEditor');
  if (!el) return;
  el.innerHTML = srvFR.map((srv, i) => `
    <div class="srv-editor-item">
      <div class="srv-editor-icon">${srv.icon}</div>
      <div class="fg">
        <label>Titre (FR)</label>
        <input type="text" class="srv-title-fr" data-idx="${i}" value="${srv.title}">
        <label style="margin-top:.5rem">Description (FR)</label>
        <textarea class="srv-desc-fr" data-idx="${i}" rows="2">${srv.desc}</textarea>
      </div>
      <div class="fg">
        <label>Title (EN)</label>
        <input type="text" class="srv-title-en" data-idx="${i}" value="${srvEN[i]?.title||''}">
        <label style="margin-top:.5rem">Description (EN)</label>
        <textarea class="srv-desc-en" data-idx="${i}" rows="2">${srvEN[i]?.desc||''}</textarea>
      </div>
    </div>
  `).join('');
}

function switchEditorTab(tab, btn) {
  document.querySelectorAll('.etab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.etab-content').forEach(c => c.style.display = 'none');
  btn.classList.add('active');
  document.getElementById(`etab-${tab}`).style.display = 'block';
  if (tab === 'images') renderImagesEditor();
  if (tab === 'typo')   renderTypoEditor();
}

function getSiteSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}

function saveEditorSettings() {
  const srvFR = SERVICES.fr.map((srv, i) => ({
    icon:  srv.icon,
    title: document.querySelector(`.srv-title-fr[data-idx="${i}"]`)?.value || srv.title,
    desc:  document.querySelector(`.srv-desc-fr[data-idx="${i}"]`)?.value  || srv.desc,
  }));
  const srvEN = SERVICES.en.map((srv, i) => ({
    icon:  srv.icon,
    title: document.querySelector(`.srv-title-en[data-idx="${i}"]`)?.value || srv.title,
    desc:  document.querySelector(`.srv-desc-en[data-idx="${i}"]`)?.value  || srv.desc,
  }));

  // Preserve existing about data, merge with new values
  const prev = getSiteSettings();
  const settings = {
    ...prev,
    hero: {
      l1_fr:  document.getElementById('ed-hero-l1-fr').value,
      l1_en:  document.getElementById('ed-hero-l1-en').value,
      l2_fr:  document.getElementById('ed-hero-l2-fr').value,
      l2_en:  document.getElementById('ed-hero-l2-en').value,
      sub_fr: document.getElementById('ed-hero-sub-fr').value,
      sub_en: document.getElementById('ed-hero-sub-en').value,
    },
    about: {
      name:          document.getElementById('ed-about-name').value,
      title_fr:      document.getElementById('ed-about-title-fr').value,
      title_en:      document.getElementById('ed-about-title-en').value,
      mainTitle_fr:  document.getElementById('ed-about-mainTitle-fr').value,
      mainTitle_en:  document.getElementById('ed-about-mainTitle-en').value,
      p1_fr:         document.getElementById('ed-about-p1-fr').value,
      p1_en:         document.getElementById('ed-about-p1-en').value,
      p2_fr:         document.getElementById('ed-about-p2-fr').value,
      p2_en:         document.getElementById('ed-about-p2-en').value,
    },
    contact: {
      phone1:  document.getElementById('ed-phone1').value,
      phone2:  document.getElementById('ed-phone2').value,
      email:   document.getElementById('ed-email').value,
      address: document.getElementById('ed-address').value,
    },
    services_fr: srvFR,
    services_en:  srvEN,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  showToast('✓ Modifications enregistrées — le site sera mis à jour au prochain chargement.');
}

/* ══════════════════════════════════
   TYPOGRAPHY MANAGER
══════════════════════════════════ */
const TYPO_KEY = 'noon_typography';

const BODY_FONTS = ['Inter','Roboto','Open Sans','Lato','Nunito','Source Sans 3','Raleway'];
const HEAD_FONTS = ['Poppins','Montserrat','Oswald','Raleway','Playfair Display','Bebas Neue','Barlow'];
const FONT_SIZES = [
  { label: 'Très petit — 13px', value: 13 },
  { label: 'Petit — 14px',      value: 14 },
  { label: 'Normal — 15px',     value: 15 },
  { label: 'Standard — 16px (défaut)', value: 16 },
  { label: 'Grand — 17px',      value: 17 },
  { label: 'Très grand — 18px', value: 18 },
];

function getTypo() {
  try { return JSON.parse(localStorage.getItem(TYPO_KEY) || '{}'); }
  catch { return {}; }
}

function renderTypoEditor() {
  const el = document.getElementById('typoEditor');
  if (!el) return;
  const t = getTypo();

  el.innerHTML = `
    <div class="typo-section">
      <h4 class="typo-section-title"><i class="fas fa-paragraph"></i> Police du Corps (textes)</h4>
      <p class="typo-hint">Utilisée pour les paragraphes, descriptions et textes courants.</p>
      <div class="font-grid" id="bodyFontGrid">
        ${BODY_FONTS.map(f => `
          <button class="font-card ${(t.bodyFont||'Inter')===f ? 'active':''}"
                  onclick="selectFont('body','${f}',this)"
                  style="font-family:'${f}',sans-serif">
            <span class="font-preview">Aa</span>
            <span class="font-name">${f}</span>
          </button>
        `).join('')}
      </div>
    </div>
    <hr class="img-divider">
    <div class="typo-section">
      <h4 class="typo-section-title"><i class="fas fa-heading"></i> Police des Titres</h4>
      <p class="typo-hint">Utilisée pour les titres de sections, le nom dans le Hero, etc.</p>
      <div class="font-grid" id="headFontGrid">
        ${HEAD_FONTS.map(f => `
          <button class="font-card ${(t.headingFont||'Poppins')===f ? 'active':''}"
                  onclick="selectFont('heading','${f}',this)"
                  style="font-family:'${f}',sans-serif">
            <span class="font-preview">Aa</span>
            <span class="font-name">${f}</span>
          </button>
        `).join('')}
      </div>
    </div>
    <hr class="img-divider">
    <div class="typo-section">
      <h4 class="typo-section-title"><i class="fas fa-text-height"></i> Taille de base</h4>
      <p class="typo-hint">Ajuste la taille globale du texte sur le site.</p>
      <div class="size-grid">
        ${FONT_SIZES.map(s => `
          <button class="size-card ${(t.fontSize||16)===s.value ? 'active':''}"
                  onclick="selectSize(${s.value},this)">
            <span class="size-demo" style="font-size:${s.value}px">A</span>
            <span>${s.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
    <hr class="img-divider">
    <div class="typo-preview-box">
      <div class="typo-preview-label">Aperçu en direct</div>
      <div id="typoPreview" class="typo-preview-content">
        <span id="tpHead" style="font-family:'${t.headingFont||'Poppins'}',sans-serif;font-size:${(t.fontSize||16)+6}px;font-weight:800;color:#0D1B2A;display:block;margin-bottom:.3rem">Expert en Électricité depuis 20+ Ans</span>
        <span id="tpBody" style="font-family:'${t.bodyFont||'Inter'}',sans-serif;font-size:${t.fontSize||16}px;color:#4a5568">Services professionnels, fiables et certifiés pour tous vos besoins électriques résidentiels et commerciaux.</span>
      </div>
    </div>
    <div style="display:flex;gap:.75rem;margin-top:1.25rem;flex-wrap:wrap">
      <button class="btn-act btn-gold" onclick="saveTypography()">
        <i class="fas fa-save"></i> Enregistrer la typographie
      </button>
      <button class="btn-act" style="background:var(--light);color:var(--navy)" onclick="resetTypography()">
        <i class="fas fa-undo"></i> Réinitialiser
      </button>
    </div>
  `;

  // preload fonts for preview
  [...BODY_FONTS, ...HEAD_FONTS].forEach(f => loadAdminFont(f));
}

function loadAdminFont(name) {
  const id = 'af-' + name.replace(/\s+/g,'-');
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g,'+')}:wght@400;700;800&display=swap`;
  document.head.appendChild(link);
}

function selectFont(type, name, btn) {
  const gridId = type === 'body' ? 'bodyFontGrid' : 'headFontGrid';
  document.querySelectorAll(`#${gridId} .font-card`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Live preview
  const t = getTypo();
  const fs = t.fontSize || 16;
  if (type === 'body') {
    const el = document.getElementById('tpBody');
    if (el) el.style.fontFamily = `'${name}',sans-serif`;
  } else {
    const el = document.getElementById('tpHead');
    if (el) el.style.fontFamily = `'${name}',sans-serif`;
  }
}

function selectSize(size, btn) {
  document.querySelectorAll('.size-card').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Live preview
  const tpHead = document.getElementById('tpHead');
  const tpBody = document.getElementById('tpBody');
  if (tpHead) tpHead.style.fontSize = (size + 6) + 'px';
  if (tpBody) tpBody.style.fontSize = size + 'px';
}

function saveTypography() {
  const bodyBtn    = document.querySelector('#bodyFontGrid .font-card.active');
  const headBtn    = document.querySelector('#headFontGrid .font-card.active');
  const sizeBtn    = document.querySelector('.size-card.active');
  const bodyFont   = bodyBtn?.querySelector('.font-name')?.textContent || 'Inter';
  const headFont   = headBtn?.querySelector('.font-name')?.textContent || 'Poppins';
  const fontSize   = sizeBtn ? parseInt(sizeBtn.querySelector('span:last-child').textContent.match(/\d+/)[0]) : 16;

  localStorage.setItem(TYPO_KEY, JSON.stringify({ bodyFont, headingFont: headFont, fontSize }));
  showToast('✓ Typographie enregistrée — rechargez le site pour voir les changements.');
}

function resetTypography() {
  if (!confirm('Réinitialiser la typographie par défaut (Inter + Poppins, 16px) ?')) return;
  localStorage.removeItem(TYPO_KEY);
  showToast('Typographie réinitialisée');
  renderTypoEditor();
}

/* ══════════════════════════════════
   IMAGE MANAGER
══════════════════════════════════ */
const IMG_KEYS = {
  noon_img_about: { label: 'Photo Électricien', desc: 'Affiché dans la section "À Propos" du site', icon: 'fa-user-hard-hat', ratio: '3:4 (portrait)' },
  noon_img_hero:  { label: 'Image Fond Hero',   desc: 'Arrière-plan de la section principale (Hero)', icon: 'fa-image',        ratio: '16:9 (paysage)' },
};

function renderImagesEditor() {
  const el = document.getElementById('imagesEditor');
  if (!el) return;

  el.innerHTML = Object.entries(IMG_KEYS).map(([key, meta]) => {
    const stored = localStorage.getItem(key);
    return `
      <div class="img-upload-section">
        <div class="img-upload-header">
          <i class="fas ${meta.icon}"></i>
          <div>
            <strong>${meta.label}</strong>
            <span>${meta.desc}</span>
          </div>
          ${stored ? `<span class="img-status img-status-ok"><i class="fas fa-check-circle"></i> Image enregistrée</span>`
                   : `<span class="img-status img-status-none"><i class="fas fa-circle"></i> Aucune image</span>`}
        </div>
        ${stored ? `
          <div class="img-preview-wrap">
            <img src="${stored}" class="img-preview" alt="${meta.label}">
            <div class="img-preview-info">
              <span><i class="fas fa-crop"></i> Ratio recommandé : ${meta.ratio}</span>
            </div>
          </div>
          <div class="img-actions">
            <label for="upload_${key}" class="btn-act btn-navy" style="cursor:pointer">
              <i class="fas fa-sync-alt"></i> Changer la photo
            </label>
            <button class="btn-act" style="background:var(--red-lt);color:var(--red)" onclick="removeImage('${key}')">
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
        ` : `
          <div class="img-drop-zone" onclick="document.getElementById('upload_${key}').click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <strong>Cliquez pour choisir une photo</strong>
            <small>JPG · PNG · WEBP — Max 5 MB — Ratio recommandé : ${meta.ratio}</small>
          </div>
        `}
        <input type="file" id="upload_${key}" accept="image/*" style="display:none"
               onchange="uploadImage('${key}', this)">
      </div>
    `;
  }).join('<hr class="img-divider">');
}

function uploadImage(key, input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('⚠️ Veuillez sélectionner une image (JPG, PNG, WEBP)'); return; }
  if (file.size > 5 * 1024 * 1024)    { showToast('⚠️ Image trop grande — maximum 5 MB'); return; }

  showToast('⏳ Chargement en cours…');
  const reader = new FileReader();
  reader.onload = (e) => {
    localStorage.setItem(key, e.target.result);
    showToast('✓ Image enregistrée avec succès !');
    renderImagesEditor();
  };
  reader.readAsDataURL(file);
}

function removeImage(key) {
  if (!confirm('Supprimer cette image du site ?')) return;
  localStorage.removeItem(key);
  showToast('Image supprimée');
  renderImagesEditor();
}

/* ══════════════════════════════════
   SETTINGS
══════════════════════════════════ */
function renderSettings() { /* fields already in HTML */ }

function exportData() {
  const data = { jobs: getJobs(), settings: getSiteSettings(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `noon_data_${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url);
  showToast('Données exportées en JSON');
}

function clearAllData() {
  if (!confirm('Supprimer TOUS les travaux enregistrés ? Cette action est irréversible.')) return;
  localStorage.removeItem(STORAGE_KEY);
  showToast('Toutes les données supprimées');
  renderDashboard();
}

/* ══════════════════════════════════
   TOAST
══════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
function initDashboard() {
  showView('dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem(AUTH_KEY) === 'ok') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'flex';
    initDashboard();
  }
  // Allow Enter key on login
  document.getElementById('loginPwd')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});
