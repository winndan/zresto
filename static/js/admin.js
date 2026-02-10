// ========================================
// ADMIN DASHBOARD
// ========================================

const CURRENCY = '\u20B1';
const STATUS_FLOW = ['new', 'preparing', 'ready', 'delivered'];
const NEXT_STATUS_LABEL = {
    new: 'Start Preparing',
    preparing: 'Mark Ready',
    ready: 'Mark Delivered',
};

function formatPrice(amount) {
    return `${CURRENCY}${Number(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

// State
let token = sessionStorage.getItem('admin_token') || null;
let settings = null;
let todaysOrders = [];
let categories = [];
let currentOrderFilter = 'all';
let orderSearchQuery = '';
let ordersPage = 1;
const ORDERS_PER_PAGE = 10;
let refreshTimer = null;
let editingItemId = null;
let editingCatId = null;
let viewingOrderId = null;

// DOM
const els = {
    loginOverlay: document.getElementById('login-overlay'),
    dashboard: document.getElementById('dashboard'),
    passwordInput: document.getElementById('admin-password'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
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
    ordersSearch: document.getElementById('orders-search'),
    ordersList: document.getElementById('orders-list'),
    ordersPagination: document.getElementById('orders-pagination'),
    ordersShowMore: document.getElementById('orders-show-more'),
    ordersEmpty: document.getElementById('orders-empty'),
    statusBreakdown: document.getElementById('status-breakdown'),
    paymentBreakdown: document.getElementById('payment-breakdown'),
    // Category management
    addCategoryBtn: document.getElementById('add-category-btn'),
    categoryList: document.getElementById('category-list'),
    catModal: document.getElementById('cat-modal'),
    catModalOverlay: document.getElementById('cat-modal-overlay'),
    catModalTitle: document.getElementById('cat-modal-title'),
    closeCatModal: document.getElementById('close-cat-modal'),
    catDisplayName: document.getElementById('cat-display-name'),
    catEmoji: document.getElementById('cat-emoji'),
    catSortOrder: document.getElementById('cat-sort-order'),
    saveCatBtn: document.getElementById('save-cat-btn'),
    deleteCatBtn: document.getElementById('delete-cat-btn'),
    // Menu item modal
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
    // Order modal
    orderModal: document.getElementById('order-modal'),
    orderModalOverlay: document.getElementById('order-modal-overlay'),
    closeOrderModal: document.getElementById('close-order-modal'),
    orderModalNumber: document.getElementById('order-modal-number'),
    orderModalStatus: document.getElementById('order-modal-status'),
    orderModalItems: document.getElementById('order-modal-items'),
    orderModalType: document.getElementById('order-modal-type'),
    orderModalUnit: document.getElementById('order-modal-unit'),
    orderModalPhone: document.getElementById('order-modal-phone'),
    orderModalPhoneRow: document.getElementById('order-modal-phone-row'),
    orderModalEmail: document.getElementById('order-modal-email'),
    orderModalEmailRow: document.getElementById('order-modal-email-row'),
    orderModalPayment: document.getElementById('order-modal-payment'),
    orderModalGcash: document.getElementById('order-modal-gcash'),
    orderModalGcashRow: document.getElementById('order-modal-gcash-row'),
    orderModalCutlery: document.getElementById('order-modal-cutlery'),
    orderModalNotes: document.getElementById('order-modal-notes'),
    orderModalTotal: document.getElementById('order-modal-total'),
    orderModalTime: document.getElementById('order-modal-time'),
    orderPrintBtn: document.getElementById('order-print-btn'),
    orderAdvanceBtn: document.getElementById('order-advance-btn'),
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
    refreshTimer = setInterval(loadOrders, 10000);
}

function handleUnauthorized() {
    token = null;
    sessionStorage.removeItem('admin_token');
    if (refreshTimer) clearInterval(refreshTimer);
    els.dashboard.classList.add('hidden');
    els.loginOverlay.classList.remove('hidden');
    els.loginError.textContent = 'Session expired. Please login again.';
}

function logout() {
    token = null;
    sessionStorage.removeItem('admin_token');
    if (refreshTimer) clearInterval(refreshTimer);
    els.dashboard.classList.add('hidden');
    els.loginOverlay.classList.remove('hidden');
    els.passwordInput.value = '';
    els.loginError.textContent = '';
}

// ========================================
// TAB NAVIGATION
// ========================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
    // Refresh data when switching to certain tabs
    if (tabName === 'orders') loadOrders();
    if (tabName === 'analytics') loadOrders();
    if (tabName === 'menu') { loadCategories(); loadMenu(); }
}

// ========================================
// DATA LOADING
// ========================================

async function loadAll() {
    await Promise.all([loadSettings(), loadCategories(), loadMenu(), loadOrders()]);
}

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        settings = await res.json();
        renderSettings();
    } catch { /* silent */ }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        categories = await res.json();
        renderCategories();
        populateCategoryDropdown();
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

async function loadOrders() {
    try {
        const res = await fetch('/api/admin/orders/today', { headers: authHeaders() });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        todaysOrders = await res.json();
        renderOrders();
        renderStats();
        renderAnalytics();
    } catch { /* silent */ }
}

// ========================================
// RENDER: SETTINGS
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

// ========================================
// RENDER: MENU
// ========================================

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

// ========================================
// RENDER: CATEGORIES
// ========================================

function renderCategories() {
    if (categories.length === 0) {
        els.categoryList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.875rem">No categories yet. Add one to get started.</p>';
        return;
    }
    els.categoryList.innerHTML = categories.map(cat => `
        <div class="category-chip" data-id="${cat.id}" data-action="edit-cat">
            <span class="category-chip-emoji">${escapeHtml(cat.emoji || '')}</span>
            <span class="category-chip-name">${escapeHtml(cat.display_name)}</span>
            <span class="category-chip-order">#${cat.sort_order}</span>
        </div>
    `).join('');
}

function populateCategoryDropdown() {
    const select = els.itemCategory;
    const currentValue = select.value;
    select.innerHTML = categories.map(cat =>
        `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.display_name)}</option>`
    ).join('');
    if (currentValue && [...select.options].some(o => o.value === currentValue)) {
        select.value = currentValue;
    }
}

// ========================================
// CATEGORY MODAL
// ========================================

function openCatModal(cat) {
    if (cat) {
        editingCatId = cat.id;
        els.catModalTitle.textContent = 'Edit Category';
        els.catDisplayName.value = cat.display_name || '';
        els.catEmoji.value = cat.emoji || '';
        els.catSortOrder.value = cat.sort_order || 0;
        els.deleteCatBtn.classList.remove('hidden');
    } else {
        editingCatId = null;
        els.catModalTitle.textContent = 'Add Category';
        els.catDisplayName.value = '';
        els.catEmoji.value = '';
        els.catSortOrder.value = categories.length + 1;
        els.deleteCatBtn.classList.add('hidden');
    }
    els.catModal.classList.remove('hidden');
}

function closeCatModal() {
    els.catModal.classList.add('hidden');
    editingCatId = null;
}

async function saveCategory() {
    const display_name = els.catDisplayName.value.trim();
    if (!display_name) { alert('Please enter a display name'); return; }

    const name = display_name.toLowerCase().replace(/\s+/g, '-');
    const emoji = els.catEmoji.value.trim();
    const sort_order = parseInt(els.catSortOrder.value) || 0;

    els.saveCatBtn.disabled = true;
    els.saveCatBtn.textContent = 'Saving...';

    try {
        const body = { name, display_name, emoji, sort_order };
        let res;

        if (editingCatId) {
            res = await fetch(`/api/admin/categories/${editingCatId}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
        } else {
            res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
        }

        if (res.status === 401) { handleUnauthorized(); return; }

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to save category');
            return;
        }

        closeCatModal();
        await loadCategories();
    } catch {
        alert('Connection error. Try again.');
    } finally {
        els.saveCatBtn.disabled = false;
        els.saveCatBtn.textContent = 'Save';
    }
}

async function deleteCategory() {
    if (!editingCatId) return;
    if (!confirm('Delete this category? Items using it will keep their current category.')) return;

    els.deleteCatBtn.disabled = true;
    els.deleteCatBtn.textContent = 'Deleting...';

    try {
        const res = await fetch(`/api/admin/categories/${editingCatId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });

        if (res.status === 401) { handleUnauthorized(); return; }

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to delete category');
            return;
        }

        closeCatModal();
        await loadCategories();
    } catch {
        alert('Connection error. Try again.');
    } finally {
        els.deleteCatBtn.disabled = false;
        els.deleteCatBtn.textContent = 'Delete';
    }
}

// ========================================
// RENDER: ORDERS
// ========================================

function renderOrders() {
    let filtered = currentOrderFilter === 'all'
        ? todaysOrders
        : todaysOrders.filter(o => o.status === currentOrderFilter);

    if (orderSearchQuery) {
        const tokens = orderSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        filtered = filtered.filter(o => {
            const haystack = [
                String(o.order_number),
                o.unit_number,
                o.phone_number || '',
                o.email || '',
                o.delivery_notes || '',
                o.items.map(i => i.name).join(' '),
            ].join(' ').toLowerCase();
            return tokens.every(t => haystack.includes(t));
        });
    }

    if (filtered.length === 0) {
        els.ordersList.innerHTML = '';
        els.ordersPagination.classList.add('hidden');
        els.ordersEmpty.classList.remove('hidden');
        return;
    }

    els.ordersEmpty.classList.add('hidden');

    const visible = filtered.slice(0, ordersPage * ORDERS_PER_PAGE);
    const hasMore = filtered.length > visible.length;

    els.ordersList.innerHTML = visible.map(order => {
        const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
        const nextLabel = NEXT_STATUS_LABEL[order.status];
        return `
            <div class="order-card" data-id="${order.id}" data-action="view-order">
                <div class="order-card-top">
                    <span class="order-card-number">#${order.order_number}</span>
                    <span class="status-badge ${order.status}">${order.status}</span>
                </div>
                <div class="order-card-middle">
                    <span class="order-card-unit">Unit ${escapeHtml(order.unit_number)}</span>
                    <span class="order-card-type">${order.order_type === 'pickup' ? 'Pick Up' : 'Delivery'}</span>
                    <span class="order-card-time">${formatTime(order.created_at)}</span>
                </div>
                <div class="order-card-bottom">
                    <span class="order-card-total">${formatPrice(order.total)}</span>
                    <span class="order-card-items">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
                    ${nextLabel ? `<button class="order-card-advance" data-id="${order.id}" data-action="advance-order">${nextLabel}</button>` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (hasMore) {
        const remaining = filtered.length - visible.length;
        els.ordersShowMore.textContent = `Show more (${remaining} remaining)`;
        els.ordersPagination.classList.remove('hidden');
    } else {
        els.ordersPagination.classList.add('hidden');
    }
}

// ========================================
// RENDER: STATS
// ========================================

function renderStats() {
    const total = todaysOrders.length;
    const revenue = todaysOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const active = todaysOrders.filter(o => o.status !== 'delivered').length;
    const delivered = todaysOrders.filter(o => o.status === 'delivered').length;

    els.statTotal.textContent = total;
    els.statRevenue.textContent = formatPrice(revenue);
    els.statActive.textContent = active;
    els.statDelivered.textContent = delivered;
}

// ========================================
// RENDER: ANALYTICS
// ========================================

function renderAnalytics() {
    // Status breakdown
    const statusCounts = {};
    STATUS_FLOW.forEach(s => statusCounts[s] = 0);
    todaysOrders.forEach(o => {
        if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });

    els.statusBreakdown.innerHTML = STATUS_FLOW.map(s => `
        <div class="breakdown-row">
            <span class="breakdown-label">
                <span class="status-badge ${s}">${s}</span>
            </span>
            <span class="breakdown-count">${statusCounts[s]}</span>
        </div>
    `).join('');

    // Payment breakdown
    const paymentTotals = {};
    todaysOrders.forEach(o => {
        const method = o.payment_method || 'cash';
        if (!paymentTotals[method]) paymentTotals[method] = { count: 0, total: 0 };
        paymentTotals[method].count++;
        paymentTotals[method].total += Number(o.total);
    });

    els.paymentBreakdown.innerHTML = Object.entries(paymentTotals).map(([method, data]) => `
        <div class="breakdown-row">
            <span class="breakdown-label">${method === 'gcash' ? 'GCash' : 'Cash'} (${data.count})</span>
            <span class="breakdown-amount">${formatPrice(data.total)}</span>
        </div>
    `).join('') || '<p style="color:var(--text-secondary);text-align:center;padding:1rem">No orders yet</p>';
}

// ========================================
// ORDER MODAL
// ========================================

function openOrderModal(orderId) {
    const order = todaysOrders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    viewingOrderId = order.id;

    els.orderModalNumber.textContent = order.order_number;
    els.orderModalStatus.textContent = order.status;
    els.orderModalStatus.className = `status-badge ${order.status}`;

    // Items
    els.orderModalItems.innerHTML = order.items.map(item => `
        <div class="order-modal-item">
            <span><span class="qty">${item.quantity}x</span> ${escapeHtml(item.name)}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
        ${item.notes ? `<div class="order-modal-item"><span class="item-notes">"${escapeHtml(item.notes)}"</span></div>` : ''}
    `).join('');

    // Details
    els.orderModalType.textContent = order.order_type === 'pickup' ? 'Pick Up' : 'Delivery';
    els.orderModalUnit.textContent = order.unit_number;

    // Phone row
    if (order.phone_number) {
        els.orderModalPhone.textContent = order.phone_number;
        els.orderModalPhoneRow.classList.remove('hidden');
    } else {
        els.orderModalPhoneRow.classList.add('hidden');
    }

    // Email row
    if (order.email) {
        els.orderModalEmail.textContent = order.email;
        els.orderModalEmailRow.classList.remove('hidden');
    } else {
        els.orderModalEmailRow.classList.add('hidden');
    }

    els.orderModalPayment.textContent = order.payment_method === 'gcash' ? 'GCash' : 'Cash';
    els.orderModalCutlery.textContent = order.cutlery ? 'Yes' : 'No';
    els.orderModalNotes.textContent = order.delivery_notes || 'None';
    els.orderModalTotal.textContent = formatPrice(order.total);
    els.orderModalTime.textContent = formatTime(order.created_at);

    // GCash ref row
    if (order.payment_method === 'gcash' && order.gcash_ref) {
        els.orderModalGcash.textContent = order.gcash_ref;
        els.orderModalGcashRow.classList.remove('hidden');
    } else {
        els.orderModalGcashRow.classList.add('hidden');
    }

    // Advance button
    const nextLabel = NEXT_STATUS_LABEL[order.status];
    if (nextLabel) {
        els.orderAdvanceBtn.textContent = nextLabel;
        els.orderAdvanceBtn.classList.remove('hidden');
        els.orderAdvanceBtn.disabled = false;
    } else {
        els.orderAdvanceBtn.classList.add('hidden');
    }

    els.orderModal.classList.remove('hidden');
}

function closeOrderModal() {
    els.orderModal.classList.add('hidden');
    viewingOrderId = null;
}

function printReceipt() {
    if (!viewingOrderId) return;
    const order = todaysOrders.find(o => o.id === viewingOrderId);
    if (!order) return;

    const orderDate = new Date(order.created_at);
    const dateStr = orderDate.toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = orderDate.toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit'
    });

    const itemsHtml = order.items.map(item => {
        const lineTotal = item.price * item.quantity;
        return `
            <tr>
                <td style="padding:6px 0;border-bottom:1px solid #eee">${item.quantity}x ${item.name}${item.notes ? '<br><small style="color:#888">' + item.notes + '</small>' : ''}</td>
                <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${CURRENCY}${Number(lineTotal).toFixed(2)}</td>
            </tr>`;
    }).join('');

    const payLabel = order.payment_method === 'gcash' ? 'GCash' : 'Cash';
    const typeLabel = order.order_type === 'pickup' ? 'Pick Up' : 'Delivery';
    const phoneLine = order.phone_number
        ? `<tr><td style="color:#555">Phone</td><td>${order.phone_number}</td></tr>` : '';
    const emailLine = order.email
        ? `<tr><td style="color:#555">Email</td><td>${order.email}</td></tr>` : '';
    const gcashLine = (order.payment_method === 'gcash' && order.gcash_ref)
        ? `<tr><td style="padding:4px 0;color:#555">GCash Ref</td><td style="padding:4px 0;text-align:right">${order.gcash_ref}</td></tr>`
        : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt #${order.order_number}</title>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:20px; max-width:360px; margin:0 auto; color:#222; }
    .header { text-align:center; margin-bottom:20px; padding-bottom:16px; border-bottom:2px solid #222; }
    .header h1 { font-size:1.25rem; margin-bottom:2px; }
    .header p { font-size:0.8125rem; color:#555; }
    .order-info { margin-bottom:16px; }
    .order-info table { width:100%; font-size:0.875rem; }
    .order-info td { padding:4px 0; }
    .order-info td:last-child { text-align:right; font-weight:600; }
    .items { margin-bottom:16px; }
    .items table { width:100%; font-size:0.875rem; border-collapse:collapse; }
    .total-row td { padding:10px 0 4px; font-weight:700; font-size:1.125rem; border-top:2px solid #222; }
    .footer { text-align:center; margin-top:24px; padding-top:16px; border-top:1px dashed #ccc; font-size:0.75rem; color:#888; }
    @media print {
        body { padding:0; }
        @page { margin:10mm; size:80mm auto; }
    }
</style>
</head>
<body>
    <div class="header">
        <h1>The Zitan</h1>
        <p>Order Receipt</p>
    </div>

    <div class="order-info">
        <table>
            <tr><td style="color:#555">Order #</td><td>${order.order_number}</td></tr>
            <tr><td style="color:#555">Date</td><td>${dateStr}</td></tr>
            <tr><td style="color:#555">Time</td><td>${timeStr}</td></tr>
            <tr><td style="color:#555">Type</td><td>${typeLabel}</td></tr>
            <tr><td style="color:#555">Unit</td><td>${order.unit_number}</td></tr>
            ${phoneLine}
            ${emailLine}
            <tr><td style="color:#555">Payment</td><td>${payLabel}</td></tr>
            ${gcashLine}
        </table>
    </div>

    <div class="items">
        <table>
            <tr style="border-bottom:2px solid #222">
                <th style="text-align:left;padding:6px 0;font-size:0.75rem;text-transform:uppercase;color:#555">Item</th>
                <th style="text-align:right;padding:6px 0;font-size:0.75rem;text-transform:uppercase;color:#555">Amount</th>
            </tr>
            ${itemsHtml}
            <tr class="total-row">
                <td>Total</td>
                <td style="text-align:right">${CURRENCY}${Number(order.total).toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Thank you for your order!</p>
        <p>The Zitan Restaurant</p>
    </div>

    <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

async function advanceOrder(orderId) {
    try {
        const res = await fetch(`/api/admin/orders/${orderId}/advance`, {
            method: 'POST',
            headers: authHeaders(),
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;

        await loadOrders();

        // Refresh modal if still open
        if (viewingOrderId === orderId) {
            const updated = todaysOrders.find(o => o.id === orderId);
            if (updated) {
                openOrderModal(orderId);
            } else {
                closeOrderModal();
            }
        }
    } catch { /* silent */ }
}

// ========================================
// ITEM MODAL
// ========================================

function openItemModal(item) {
    els.itemImageFile.value = '';
    const defaultCat = categories.length > 0 ? categories[0].name : '';

    if (item) {
        editingItemId = item.id;
        els.itemModalTitle.textContent = 'Edit Menu Item';
        els.itemName.value = item.name || '';
        els.itemDescription.value = item.description || '';
        els.itemPrice.value = item.price || '';
        els.itemCategory.value = item.category || defaultCat;
        els.itemImage.value = item.image_url || '';
        els.deleteItemBtn.classList.remove('hidden');
        showImagePreview(item.image_url);
    } else {
        editingItemId = null;
        els.itemModalTitle.textContent = 'Add Menu Item';
        els.itemName.value = '';
        els.itemDescription.value = '';
        els.itemPrice.value = '';
        els.itemCategory.value = defaultCat;
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

function closeItemModal() {
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
        let image_url = els.itemImage.value || null;
        const fileInput = els.itemImageFile;
        if (fileInput.files && fileInput.files[0]) {
            const uploaded = await uploadImage(fileInput.files[0]);
            if (uploaded === null) return;
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

        closeItemModal();
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

        closeItemModal();
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

// Logout
els.logoutBtn.addEventListener('click', logout);

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Orders search
let orderSearchTimeout;
els.ordersSearch.addEventListener('input', () => {
    clearTimeout(orderSearchTimeout);
    orderSearchTimeout = setTimeout(() => {
        orderSearchQuery = els.ordersSearch.value.trim();
        ordersPage = 1;
        renderOrders();
    }, 200);
});

// Order filters
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentOrderFilter = btn.dataset.filter;
        ordersPage = 1;
        document.querySelectorAll('.filter-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.filter === currentOrderFilter)
        );
        renderOrders();
    });
});

// Orders pagination
els.ordersShowMore.addEventListener('click', () => {
    ordersPage++;
    renderOrders();
});

// Orders list (delegation)
els.ordersList.addEventListener('click', (e) => {
    // Advance button
    const advBtn = e.target.closest('[data-action="advance-order"]');
    if (advBtn) {
        e.stopPropagation();
        advanceOrder(parseInt(advBtn.dataset.id));
        return;
    }
    // View order card
    const card = e.target.closest('[data-action="view-order"]');
    if (card) {
        openOrderModal(card.dataset.id);
    }
});

// Order modal
els.closeOrderModal.addEventListener('click', closeOrderModal);
els.orderModalOverlay.addEventListener('click', closeOrderModal);
els.orderPrintBtn.addEventListener('click', printReceipt);
els.orderAdvanceBtn.addEventListener('click', () => {
    if (viewingOrderId) {
        els.orderAdvanceBtn.disabled = true;
        advanceOrder(viewingOrderId);
    }
});

// Settings
els.acceptingToggle.addEventListener('change', () => {
    updateSetting('accepting_orders', els.acceptingToggle.checked);
});

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
        toggleMenuItem(input.dataset.id, input.checked);
    }
});

// Menu item edit (click on info area)
els.menuList.addEventListener('click', async (e) => {
    const info = e.target.closest('[data-action="edit-item"]');
    if (!info) return;
    const item = await fetchItemForEdit(info.dataset.id);
    if (item) openItemModal(item);
});

// Add item button
els.addItemBtn.addEventListener('click', () => openItemModal(null));

// Category management
els.addCategoryBtn.addEventListener('click', () => openCatModal(null));
els.closeCatModal.addEventListener('click', closeCatModal);
els.catModalOverlay.addEventListener('click', closeCatModal);
els.saveCatBtn.addEventListener('click', saveCategory);
els.deleteCatBtn.addEventListener('click', deleteCategory);

// Category list (click to edit)
els.categoryList.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-action="edit-cat"]');
    if (!chip) return;
    const cat = categories.find(c => String(c.id) === String(chip.dataset.id));
    if (cat) openCatModal(cat);
});

// Item modal controls
els.closeItemModal.addEventListener('click', closeItemModal);
els.itemModalOverlay.addEventListener('click', closeItemModal);
els.saveItemBtn.addEventListener('click', saveItem);
els.deleteItemBtn.addEventListener('click', deleteItem);

// Image file picker
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
