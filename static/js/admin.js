// ========================================
// ADMIN DASHBOARD
// ========================================

const CURRENCY = '\u20B1';

function formatPrice(amount) {
    return `${CURRENCY}${Number(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// State
let token = sessionStorage.getItem('admin_token') || null;
let settings = null;
let refreshTimer = null;
let editingItemId = null; // null = adding new, number = editing existing

// DOM
const els = {
    loginOverlay: document.getElementById('login-overlay'),
    dashboard: document.getElementById('dashboard'),
    passwordInput: document.getElementById('admin-password'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    statusDot: document.getElementById('status-dot'),
    statusLabel: document.getElementById('status-label'),
    acceptingToggle: document.getElementById('accepting-toggle'),
    prepDecrease: document.getElementById('prep-decrease'),
    prepIncrease: document.getElementById('prep-increase'),
    prepDisplay: document.getElementById('prep-time-display'),
    statTotal: document.getElementById('stat-total'),
    statRevenue: document.getElementById('stat-revenue'),
    statActive: document.getElementById('stat-active'),
    statDelivered: document.getElementById('stat-delivered'),
    menuList: document.getElementById('menu-list'),
    addItemBtn: document.getElementById('add-item-btn'),
    // Modal
    itemModal: document.getElementById('item-modal'),
    itemModalOverlay: document.getElementById('item-modal-overlay'),
    itemModalTitle: document.getElementById('item-modal-title'),
    closeItemModal: document.getElementById('close-item-modal'),
    itemName: document.getElementById('item-name'),
    itemDescription: document.getElementById('item-description'),
    itemPrice: document.getElementById('item-price'),
    itemCategory: document.getElementById('item-category'),
    itemImage: document.getElementById('item-image'),
    itemImageFile: document.getElementById('item-image-file'),
    imagePreview: document.getElementById('image-preview'),
    removeImageBtn: document.getElementById('remove-image-btn'),
    saveItemBtn: document.getElementById('save-item-btn'),
    deleteItemBtn: document.getElementById('delete-item-btn'),
};

// ========================================
// AUTH
// ========================================

function authHeaders() {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function login() {
    const password = els.passwordInput.value;
    if (!password) return;

    els.loginBtn.disabled = true;
    els.loginBtn.textContent = 'Logging in...';
    els.loginError.textContent = '';

    try {
        const res = await fetch('/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (!res.ok) {
            const err = await res.json();
            els.loginError.textContent = err.error || 'Invalid password';
            return;
        }

        const data = await res.json();
        token = data.token;
        sessionStorage.setItem('admin_token', token);
        showDashboard();
    } catch {
        els.loginError.textContent = 'Connection error. Try again.';
    } finally {
        els.loginBtn.disabled = false;
        els.loginBtn.textContent = 'Login';
    }
}

function showDashboard() {
    els.loginOverlay.classList.add('hidden');
    els.dashboard.classList.remove('hidden');
    loadAll();
    refreshTimer = setInterval(loadStats, 30000);
}

function handleUnauthorized() {
    token = null;
    sessionStorage.removeItem('admin_token');
    if (refreshTimer) clearInterval(refreshTimer);
    els.dashboard.classList.add('hidden');
    els.loginOverlay.classList.remove('hidden');
    els.loginError.textContent = 'Session expired. Please login again.';
}

// ========================================
// DATA LOADING
// ========================================

async function loadAll() {
    await Promise.all([loadSettings(), loadMenu(), loadStats()]);
}

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        settings = await res.json();
        renderSettings();
    } catch { /* silent */ }
}

async function loadMenu() {
    try {
        const res = await fetch('/api/admin/menu', { headers: authHeaders() });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        const items = await res.json();
        renderMenu(items);
    } catch { /* silent */ }
}

async function loadStats() {
    try {
        const res = await fetch('/api/admin/orders/today', { headers: authHeaders() });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        const orders = await res.json();
        renderStats(orders);
    } catch { /* silent */ }
}

// ========================================
// RENDER
// ========================================

function renderSettings() {
    if (!settings) return;

    els.acceptingToggle.checked = settings.accepting_orders;
    els.prepDisplay.textContent = `${settings.prep_time_minutes} min`;

    if (settings.accepting_orders) {
        els.statusDot.className = 'status-dot open';
        els.statusLabel.textContent = 'Open';
    } else {
        els.statusDot.className = 'status-dot closed';
        els.statusLabel.textContent = 'Paused';
    }
}

function renderMenu(items) {
    els.menuList.innerHTML = items.map(item => `
        <div class="menu-item-row ${item.is_available ? '' : 'unavailable'}" data-id="${item.id}">
            <div class="menu-item-info" data-id="${item.id}" data-action="edit-item">
                <span class="menu-item-name">${escapeHtml(item.name)}</span>
                <span class="menu-item-meta">
                    <span class="menu-item-price">${formatPrice(item.price)}</span>
                    &middot; ${escapeHtml(item.category)}
                </span>
            </div>
            <div class="menu-item-actions">
                <label class="toggle-switch">
                    <input type="checkbox" ${item.is_available ? 'checked' : ''}
                           data-id="${item.id}" data-action="toggle-item">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function renderStats(orders) {
    const total = orders.length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const active = orders.filter(o => o.status !== 'delivered').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;

    els.statTotal.textContent = total;
    els.statRevenue.textContent = formatPrice(revenue);
    els.statActive.textContent = active;
    els.statDelivered.textContent = delivered;
}

// ========================================
// ITEM MODAL
// ========================================

function openItemModal(item) {
    // Reset file input
    els.itemImageFile.value = '';

    if (item) {
        // Edit mode
        editingItemId = item.id;
        els.itemModalTitle.textContent = 'Edit Menu Item';
        els.itemName.value = item.name || '';
        els.itemDescription.value = item.description || '';
        els.itemPrice.value = item.price || '';
        els.itemCategory.value = item.category || 'mains';
        els.itemImage.value = item.image_url || '';
        els.deleteItemBtn.classList.remove('hidden');
        showImagePreview(item.image_url);
    } else {
        // Add mode
        editingItemId = null;
        els.itemModalTitle.textContent = 'Add Menu Item';
        els.itemName.value = '';
        els.itemDescription.value = '';
        els.itemPrice.value = '';
        els.itemCategory.value = 'mains';
        els.itemImage.value = '';
        els.deleteItemBtn.classList.add('hidden');
        showImagePreview(null);
    }
    els.itemModal.classList.remove('hidden');
}

function showImagePreview(url) {
    if (url) {
        els.imagePreview.src = url;
        els.imagePreview.classList.remove('hidden');
        els.removeImageBtn.classList.remove('hidden');
    } else {
        els.imagePreview.src = '';
        els.imagePreview.classList.add('hidden');
        els.removeImageBtn.classList.add('hidden');
    }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });

    if (res.status === 401) { handleUnauthorized(); return null; }

    if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to upload image');
        return null;
    }

    const data = await res.json();
    return data.url;
}

function closeModal() {
    els.itemModal.classList.add('hidden');
    editingItemId = null;
}

async function saveItem() {
    const name = els.itemName.value.trim();
    const description = els.itemDescription.value.trim();
    const price = parseFloat(els.itemPrice.value);
    const category = els.itemCategory.value;

    if (!name) { alert('Please enter a name'); return; }
    if (isNaN(price) || price < 0) { alert('Please enter a valid price'); return; }

    els.saveItemBtn.disabled = true;
    els.saveItemBtn.textContent = 'Saving...';

    try {
        // Upload new image if a file was selected
        let image_url = els.itemImage.value || null;
        const fileInput = els.itemImageFile;
        if (fileInput.files && fileInput.files[0]) {
            const uploaded = await uploadImage(fileInput.files[0]);
            if (uploaded === null) return; // upload failed or unauthorized
            image_url = uploaded;
        }

        const body = { name, description, price, category, image_url };

        let res;
        if (editingItemId) {
            res = await fetch(`/api/admin/menu/${editingItemId}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
        } else {
            body.is_available = true;
            res = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
        }

        if (res.status === 401) { handleUnauthorized(); return; }

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to save item');
            return;
        }

        closeModal();
        await loadMenu();
    } catch {
        alert('Connection error. Try again.');
    } finally {
        els.saveItemBtn.disabled = false;
        els.saveItemBtn.textContent = 'Save';
    }
}

async function deleteItem() {
    if (!editingItemId) return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    els.deleteItemBtn.disabled = true;
    els.deleteItemBtn.textContent = 'Deleting...';

    try {
        const res = await fetch(`/api/admin/menu/${editingItemId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });

        if (res.status === 401) { handleUnauthorized(); return; }

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to delete item');
            return;
        }

        closeModal();
        await loadMenu();
    } catch {
        alert('Connection error. Try again.');
    } finally {
        els.deleteItemBtn.disabled = false;
        els.deleteItemBtn.textContent = 'Delete';
    }
}

// ========================================
// ACTIONS
// ========================================

async function updateSetting(key, value) {
    try {
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ [key]: value }),
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        settings = await res.json();
        renderSettings();
    } catch { /* silent */ }
}

async function toggleMenuItem(itemId, isAvailable) {
    try {
        const res = await fetch(`/api/admin/menu/${itemId}/toggle`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ is_available: isAvailable }),
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        await loadMenu();
    } catch { /* silent */ }
}

// Helper: find item data from rendered DOM is unreliable, so fetch fresh
async function fetchItemForEdit(itemId) {
    try {
        const res = await fetch('/api/admin/menu', { headers: authHeaders() });
        if (res.status === 401) { handleUnauthorized(); return null; }
        if (!res.ok) return null;
        const items = await res.json();
        return items.find(i => String(i.id) === String(itemId)) || null;
    } catch { return null; }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Login
els.loginBtn.addEventListener('click', login);
els.passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
});

// Accepting orders toggle
els.acceptingToggle.addEventListener('change', () => {
    updateSetting('accepting_orders', els.acceptingToggle.checked);
});

// Prep time buttons
els.prepDecrease.addEventListener('click', () => {
    if (!settings) return;
    const newVal = Math.max(5, settings.prep_time_minutes - 5);
    updateSetting('prep_time_minutes', newVal);
});

els.prepIncrease.addEventListener('click', () => {
    if (!settings) return;
    const newVal = Math.min(120, settings.prep_time_minutes + 5);
    updateSetting('prep_time_minutes', newVal);
});

// Menu item toggles (event delegation)
els.menuList.addEventListener('change', (e) => {
    const input = e.target;
    if (input.dataset.action === 'toggle-item') {
        const itemId = input.dataset.id;
        toggleMenuItem(itemId, input.checked);
    }
});

// Menu item edit (click on info area)
els.menuList.addEventListener('click', async (e) => {
    const info = e.target.closest('[data-action="edit-item"]');
    if (!info) return;
    const itemId = info.dataset.id;
    const item = await fetchItemForEdit(itemId);
    if (item) openItemModal(item);
});

// Add item button
els.addItemBtn.addEventListener('click', () => openItemModal(null));

// Modal controls
els.closeItemModal.addEventListener('click', closeModal);
els.itemModalOverlay.addEventListener('click', closeModal);
els.saveItemBtn.addEventListener('click', saveItem);
els.deleteItemBtn.addEventListener('click', deleteItem);

// Image file picker — show local preview immediately
els.itemImageFile.addEventListener('change', () => {
    const file = els.itemImageFile.files[0];
    if (file) {
        const localUrl = URL.createObjectURL(file);
        showImagePreview(localUrl);
    }
});

// Remove image button
els.removeImageBtn.addEventListener('click', () => {
    els.itemImage.value = '';
    els.itemImageFile.value = '';
    showImagePreview(null);
});

// ========================================
// INIT
// ========================================

if (token) {
    fetch('/api/admin/menu', { headers: authHeaders() }).then(res => {
        if (res.ok) {
            showDashboard();
        } else {
            handleUnauthorized();
        }
    }).catch(() => handleUnauthorized());
}
