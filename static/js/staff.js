// ========================================
// KITCHEN DASHBOARD
// ========================================

const CURRENCY = '\u20B1';
const POLL_INTERVAL = 5000;

function formatPrice(amount) {
    return `${CURRENCY}${Number(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
}

const NEXT_STATUS = {
    'new': { label: 'Start Preparing', cls: 'to-preparing' },
    'preparing': { label: 'Mark Ready', cls: 'to-ready' },
    'ready': { label: 'Mark Delivered', cls: 'to-delivered' }
};

// DOM refs
const columns = {
    new: document.getElementById('orders-new'),
    preparing: document.getElementById('orders-preparing'),
    ready: document.getElementById('orders-ready')
};

const counts = {
    new: document.getElementById('count-new'),
    preparing: document.getElementById('count-preparing'),
    ready: document.getElementById('count-ready')
};

const activeCount = document.getElementById('active-count');

// ========================================
// RENDER
// ========================================

function renderOrderCard(order) {
    const next = NEXT_STATUS[order.status];
    const items = order.items || [];

    const itemsHtml = items.map(item => {
        let line = `<li><span><span class="qty">${item.quantity}x</span> ${item.name}</span><span>${formatPrice(item.price * item.quantity)}</span></li>`;
        if (item.notes) {
            line += `<li class="item-notes">${item.notes}</li>`;
        }
        return line;
    }).join('');

    const notesHtml = order.delivery_notes
        ? `<div class="order-notes">${order.delivery_notes}</div>`
        : '';

    return `
        <div class="order-card" data-id="${order.id}">
            <div class="order-top">
                <span class="order-number">#${order.order_number}</span>
                <span class="order-unit">Unit ${order.unit_number}</span>
            </div>
            <div class="order-time">${timeAgo(order.created_at)}</div>
            <ul class="order-items">${itemsHtml}</ul>
            ${notesHtml}
            <div class="order-total">${formatPrice(order.total)}</div>
            ${next ? `<button class="btn-advance ${next.cls}" onclick="advanceOrder(${order.id})" data-order-id="${order.id}">${next.label}</button>` : ''}
        </div>
    `;
}

function renderOrders(orders) {
    const grouped = { new: [], preparing: [], ready: [] };

    orders.forEach(order => {
        if (grouped[order.status]) {
            grouped[order.status].push(order);
        }
    });

    Object.keys(columns).forEach(status => {
        columns[status].innerHTML = grouped[status].map(renderOrderCard).join('');
        counts[status].textContent = grouped[status].length;
    });

    const total = orders.length;
    activeCount.textContent = total;
}

// ========================================
// API
// ========================================

async function fetchOrders() {
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) return;
        const orders = await res.json();
        renderOrders(orders);
    } catch {
        // Silently retry next interval
    }
}

async function advanceOrder(orderId) {
    const btn = document.querySelector(`[data-order-id="${orderId}"]`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Updating...';
    }

    try {
        const res = await fetch(`/api/orders/${orderId}/advance`, { method: 'POST' });
        if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Failed to update order');
            return;
        }
        // Refresh immediately after advancing
        await fetchOrders();
    } catch {
        alert('Connection error. Please try again.');
    } finally {
        if (btn) {
            btn.disabled = false;
        }
    }
}

// ========================================
// INIT
// ========================================

fetchOrders();
setInterval(fetchOrders, POLL_INTERVAL);
