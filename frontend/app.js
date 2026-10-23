// Campus Lost & Found — frontend logic (talks to the Express REST API)
const API = '/api/items';

const state = { type: '', category: '', q: '', showClaimed: false };
let editingId = null;

const $ = (sel) => document.querySelector(sel);
const board = $('#board');
const listMessage = $('#listMessage');
const itemDialog = $('#itemDialog');
const itemForm = $('#itemForm');
const formError = $('#formError');
const matchDialog = $('#matchDialog');

// ---------- Helpers ----------
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---------- Read ----------
async function loadCategories() {
  const categories = await api(`${API}/categories`);
  const options = categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  $('#categoryFilter').insertAdjacentHTML('beforeend', options);
  $('#categorySelect').innerHTML = options;
}

async function loadStats() {
  try {
    const s = await api(`${API}/stats`);
    $('#stats').innerHTML =
      `<span><b>${s.lostOpen}</b> still lost</span>` +
      `<span><b>${s.foundOpen}</b> waiting to be picked up</span>` +
      `<span><b>${s.claimed}</b> returned to owners</span>`;
  } catch {
    $('#stats').textContent = '';
  }
}

async function loadItems() {
  const params = new URLSearchParams();
  if (state.type) params.set('type', state.type);
  if (state.category) params.set('category', state.category);
  if (state.q) params.set('q', state.q);
  if (!state.showClaimed) params.set('status', 'open');

  listMessage.className = 'message';
  listMessage.textContent = 'Loading items…';
  try {
    const items = await api(`${API}?${params}`);
    listMessage.textContent = items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : '';
    renderItems(items);
  } catch (err) {
    listMessage.className = 'message error';
    listMessage.textContent = `Couldn't load items: ${err.message}. Check that the server and MongoDB are running.`;
    board.innerHTML = '';
  }
}

function renderItems(items) {
  if (!items.length) {
    const filtered = state.type || state.category || state.q;
    board.innerHTML = `
      <div class="empty">
        <p>${filtered ? 'No items match these filters.' : 'Nothing has been reported yet.'}</p>
        <button class="btn btn-primary" type="button" data-action="new">Report an item</button>
      </div>`;
    return;
  }
  board.innerHTML = items.map(cardHTML).join('');
}

function cardHTML(item) {
  const claimed = item.status === 'claimed';
  const actions = claimed
    ? `<button type="button" data-action="reopen">Reopen</button>
       <button type="button" data-action="delete" class="danger">Delete</button>`
    : `<button type="button" data-action="matches">Find matches</button>
       <button type="button" data-action="edit">Edit</button>
       <button type="button" data-action="claim">Mark as claimed</button>
       <button type="button" data-action="delete" class="danger">Delete</button>`;

  return `
  <article class="tag-wrap" data-id="${item._id}">
    <div class="tag tag--${item.type} ${claimed ? 'is-claimed' : ''}">
      <div class="tag-head">
        <span class="badge">${item.type === 'lost' ? 'Lost' : 'Found'}</span>
        <span class="cat">${escapeHtml(item.category)}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="Photo of ${escapeHtml(item.title)}" loading="lazy" />` : ''}
      ${item.description ? `<p class="desc">${escapeHtml(item.description)}</p>` : ''}
      <dl class="facts">
        <div><dt>Where</dt><dd>${escapeHtml(item.location)}</dd></div>
        <div><dt>When</dt><dd>${formatDate(item.date)}</dd></div>
        <div><dt>Contact</dt><dd>${escapeHtml(item.contactName)}, ${escapeHtml(item.contactInfo)}</dd></div>
      </dl>
      <div class="actions">${actions}</div>
      ${claimed ? '<span class="stamp" aria-label="Claimed">Claimed</span>' : ''}
    </div>
  </article>`;
}

// ---------- Create / Update ----------
function openForm(item = null) {
  editingId = item ? item._id : null;
  itemForm.reset();
  formError.textContent = '';
  $('#dateInput').max = todayISO();

  if (item) {
    $('#formTitle').textContent = 'Edit item';
    $('#saveBtn').textContent = 'Save changes';
    itemForm.type.value = item.type;
    ['title', 'category', 'location', 'description', 'contactName', 'contactInfo', 'imageUrl']
      .forEach((f) => { itemForm[f].value = item[f] || ''; });
    itemForm.date.value = item.date.slice(0, 10);
  } else {
    $('#formTitle').textContent = 'Report an item';
    $('#saveBtn').textContent = 'Post item';
    itemForm.date.value = todayISO();
  }
  itemDialog.showModal();
  itemForm.title.focus();
}

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  if (!itemForm.checkValidity()) {
    const firstInvalid = itemForm.querySelector(':invalid');
    const label = firstInvalid.closest('label')?.childNodes[0]?.textContent.trim() || 'A field';
    formError.textContent = `${label}: ${firstInvalid.validationMessage}`;
    firstInvalid.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(itemForm));
  const saveBtn = $('#saveBtn');
  saveBtn.disabled = true;
  try {
    if (editingId) {
      await api(`${API}/${editingId}`, { method: 'PUT', body: JSON.stringify(data) });
      toast('Changes saved');
    } else {
      await api(API, { method: 'POST', body: JSON.stringify(data) });
      toast('Item posted');
    }
    itemDialog.close();
    refresh();
  } catch (err) {
    formError.textContent = err.message;
  } finally {
    saveBtn.disabled = false;
  }
});

// ---------- Card actions (edit, claim, reopen, delete, matches) ----------
board.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'new') return openForm();

  const id = btn.closest('[data-id]').dataset.id;
  try {
    if (action === 'edit') {
      openForm(await api(`${API}/${id}`));
    } else if (action === 'claim') {
      await api(`${API}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'claimed' }) });
      toast('Marked as claimed');
      refresh();
    } else if (action === 'reopen') {
      await api(`${API}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'open' }) });
      toast('Reopened');
      refresh();
    } else if (action === 'delete') {
      if (!confirm('Delete this item? This cannot be undone.')) return;
      await api(`${API}/${id}`, { method: 'DELETE' });
      toast('Item deleted');
      refresh();
    } else if (action === 'matches') {
      showMatches(id);
    }
  } catch (err) {
    toast(err.message);
  }
});

async function showMatches(id) {
  const item = await api(`${API}/${id}`);
  const matches = await api(`${API}/${id}/matches`);
  const opposite = item.type === 'lost' ? 'found' : 'lost';

  $('#matchTitle').textContent = `Possible matches for “${item.title}”`;
  $('#matchIntro').textContent = matches.length
    ? `Open ${opposite} reports in ${item.category} within 30 days, best matches first.`
    : `No open ${opposite} reports in ${item.category} look like this yet. Check back later.`;

  $('#matchList').innerHTML = matches.map(({ item: m, reasons }) => `
    <li>
      <strong>${escapeHtml(m.title)}</strong>
      <div class="meta">${escapeHtml(m.location)}, ${formatDate(m.date)}. Contact ${escapeHtml(m.contactName)}, ${escapeHtml(m.contactInfo)}</div>
      <div class="reasons">${reasons.map(escapeHtml).join('. ')}</div>
    </li>`).join('');
  matchDialog.showModal();
}

// ---------- Filters ----------
document.querySelectorAll('.segmented button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.segmented button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    state.type = btn.dataset.type;
    loadItems();
  });
});

let searchTimer;
$('#searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadItems(); }, 300);
});

$('#categoryFilter').addEventListener('change', (e) => { state.category = e.target.value; loadItems(); });
$('#showClaimed').addEventListener('change', (e) => { state.showClaimed = e.target.checked; loadItems(); });

// ---------- Dialog close buttons ----------
document.querySelectorAll('[data-close]').forEach((btn) =>
  btn.addEventListener('click', () => btn.closest('dialog').close()));

$('#newItemBtn').addEventListener('click', () => openForm());

// ---------- Start ----------
function refresh() {
  loadItems();
  loadStats();
}

loadCategories().catch(() => {}).finally(refresh);
