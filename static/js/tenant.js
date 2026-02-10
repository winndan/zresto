// ========================================
// Zitan - FOOD ORDERING APP
// ========================================

const CURRENCY = '₱';
const TRACKING_KEY = 'zitan_tracking_token';

function formatPrice(amount) {
    return `${CURRENCY}${amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

let menuItems = [];
let restaurantSettings = null;

async function fetchMenuItems() {
    const res = await fetch("/api/menu");
    if (!res.ok) {
        console.error("Failed to fetch menu items");
        return [];
    }
    return await res.json();
}

async function checkRestaurantStatus() {
    try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        restaurantSettings = await res.json();
        const banner = document.getElementById('paused-banner');
        if (!restaurantSettings.accepting_orders) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    } catch { /* silent */ }
}


// App State
let cart = {}; // { itemId: { quantity, notes } }
let currentCategory = 'all';
let searchQuery = '';
let editingItemId = null;
let currentOrder = null;

// DOM Elements
const screens = {
    menu: document.getElementById('menu-screen'),
    cart: document.getElementById('cart-screen'),
    status: document.getElementById('status-screen')
};

const elements = {
    menuItems: document.getElementById('menu-items'),
    cartItems: document.getElementById('cart-items'),
    cartSummary: document.getElementById('cart-summary'),
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    cartTotalLarge: document.getElementById('cart-total-large'),
    subtotal: document.getElementById('subtotal'),
    unitNumber: document.getElementById('unit-number'),
    phoneNumber: document.getElementById('phone-number'),
    deliveryNotes: document.getElementById('delivery-notes'),
    placeOrderBtn: document.getElementById('place-order-btn'),
    viewCartBtn: document.getElementById('view-cart-btn'),
    backToMenuBtn: document.getElementById('back-to-menu'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    browseMenuBtn: document.getElementById('browse-menu-btn'),
    newOrderBtn: document.getElementById('new-order-btn'),
    cartEmptyState: document.querySelector('.cart-empty-state'),
    editModal: document.getElementById('edit-modal'),
    editItemName: document.getElementById('edit-item-name'),
    editQuantity: document.getElementById('edit-quantity'),
    editNotes: document.getElementById('edit-notes'),
    closeModalBtn: document.getElementById('close-modal'),
    qtyDecreaseBtn: document.getElementById('qty-decrease'),
    qtyIncreaseBtn: document.getElementById('qty-increase'),
    removeItemBtn: document.getElementById('remove-item-btn'),
    saveChangesBtn: document.getElementById('save-changes-btn'),
    orderNumber: document.getElementById('order-number'),
    deliveryUnit: document.getElementById('delivery-unit'),
    estTime: document.getElementById('est-time'),
    orderItemsList: document.getElementById('order-items-list'),
    modalOverlay: document.querySelector('#edit-modal .modal-overlay'),
    // Item detail modal
    itemDetailModal: document.getElementById('item-detail-modal'),
    detailImage: document.getElementById('detail-image'),
    detailName: document.getElementById('detail-item-name'),
    detailDescription: document.getElementById('detail-description'),
    detailPrice: document.getElementById('detail-price'),
    detailAddBtn: document.getElementById('detail-add-btn'),
    detailCloseBtn: document.getElementById('close-detail'),
    detailOverlay: document.getElementById('detail-overlay'),
    statusIcon: document.getElementById('status-icon'),
    statusText: document.getElementById('status-text'),
    statusMessage: document.getElementById('status-message'),
    progressFill: document.getElementById('progress-fill')
};

// ========================================
// INITIALIZATION
// ========================================
async function init() {
    await checkRestaurantStatus();
    menuItems = await fetchMenuItems();
    renderMenu();
    setupEventListeners();

    // Resume tracking if we have a saved token
    const savedToken = localStorage.getItem(TRACKING_KEY);
    if (savedToken) {
        try {
            const res = await fetch(`/api/orders/track/${savedToken}`);
            if (res.ok) {
                const order = await res.json();
                if (order.status === 'delivered') {
                    // Order already delivered — clear token, show menu
                    localStorage.removeItem(TRACKING_KEY);
                } else {
                    // Resume status screen
                    currentOrder = {
                        trackingToken: order.tracking_token,
                        orderNumber: order.order_number,
                        unitNumber: order.unit_number,
                        items: order.items,
                        total: order.total,
                        status: order.status
                    };
                    showScreen('status');
                    renderOrderStatus();
                    startStatusPolling();
                }
            } else {
                // Token invalid (404) — clear it
                localStorage.removeItem(TRACKING_KEY);
            }
        } catch {
            // Network error — keep token, will retry on next load
        }
    }
}


// ========================================
// MENU FUNCTIONS
// ========================================
function renderMenu() {
    let filteredItems = currentCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === currentCategory);

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        );
    }

    if (filteredItems.length === 0) {
        elements.menuItems.innerHTML = `
            <div class="empty-menu">
                <p>No items found</p>
            </div>
        `;
        return;
    }

    elements.menuItems.innerHTML = filteredItems.map(item => {
        const cartItem = cart[item.id];
        const quantity = cartItem ? cartItem.quantity : 0;
        
        return `
            <div class="food-card" data-id="${item.id}">
                <div class="food-image">
                    <img
                        src="${item.image_url || '/static/images/placeholder.png'}"
                        alt="${item.name}"
                        loading="lazy"
                    />
                </div>
                <div class="food-info">
                    <h3 class="food-name">${item.name}</h3>
                    <p class="food-description">${item.description}</p>
                    <div class="food-bottom">
                        <p class="food-price">${formatPrice(item.price)}</p>
                        <div class="food-actions">
                            ${quantity > 0 ? `<span class="quantity-badge">${quantity}</span>` : ''}
                            <button class="btn-add" data-id="${item.id}" data-action="add">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterMenu(category) {
    currentCategory = category;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    renderMenu();
}

// ========================================
// CART FUNCTIONS
// ========================================
function addToCart(itemId) {
    if (!cart[itemId]) {
        cart[itemId] = { quantity: 0, notes: '' };
    }
    cart[itemId].quantity++;
    
    renderMenu();
    updateCartSummary();
    
    // Animate cart summary
    elements.cartSummary.style.animation = 'none';
    setTimeout(() => {
        elements.cartSummary.style.animation = '';
    }, 10);
}

function removeFromCart(itemId) {
    if (cart[itemId] && cart[itemId].quantity > 0) {
        cart[itemId].quantity--;
        if (cart[itemId].quantity === 0) {
            delete cart[itemId];
        }
    }
    
    renderMenu();
    renderCart();
    updateCartSummary();
}

function updateCartItemQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
        delete cart[itemId];
    } else {
        if (!cart[itemId]) {
            cart[itemId] = { quantity: 0, notes: '' };
        }
        cart[itemId].quantity = newQuantity;
    }
    
    renderMenu();
    renderCart();
    updateCartSummary();
}

function updateCartItemNotes(itemId, notes) {
    if (cart[itemId]) {
        cart[itemId].notes = notes;
    }
}

function clearCart() {
    if (Object.keys(cart).length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = {};
        renderMenu();
        renderCart();
        updateCartSummary();
    }
}

function getCartTotals() {
    let totalItems = 0;
    let totalPrice = 0;
    
    Object.entries(cart).forEach(([id, item]) => {
        if (item.quantity > 0) {
            const menuItem = menuItems.find(m => String(m.id) === String(id));
            totalItems += item.quantity;
            totalPrice += menuItem.price * item.quantity;
        }
    });
    
    return { totalItems, totalPrice };
}

function updateCartSummary() {
    const { totalItems, totalPrice } = getCartTotals();
    
    elements.cartCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    elements.cartTotal.textContent = formatPrice(totalPrice);
    elements.subtotal.textContent = formatPrice(totalPrice);
    elements.cartTotalLarge.textContent = formatPrice(totalPrice);

    
    if (totalItems > 0) {
        elements.cartSummary.classList.remove('hidden');
    } else {
        elements.cartSummary.classList.add('hidden');
    }
}

function renderCart() {
    const cartItemIds = Object.keys(cart).filter(id => cart[id].quantity > 0);
    
    if (cartItemIds.length === 0) {
        elements.cartItems.classList.add('hidden');
        elements.cartEmptyState.classList.remove('hidden');
        elements.placeOrderBtn.disabled = true;
    } else {
        elements.cartItems.classList.remove('hidden');
        elements.cartEmptyState.classList.add('hidden');
        
        elements.cartItems.innerHTML = cartItemIds.map(id => {
            const item = menuItems.find(m => String(m.id) === String(id));
            const cartItem = cart[id];
            const itemTotal = item.price * cartItem.quantity;
            
            return `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image"><img src="${item.image_url || '/static/images/placeholder.png'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)"></div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        ${cartItem.notes ? `<p class="cart-item-notes">"${cartItem.notes}"</p>` : ''}
                        <p class="cart-item-price">${formatPrice(itemTotal)}</p>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" data-id="${item.id}" data-action="decrease">−</button>
                        <span class="qty-value">${cartItem.quantity}</span>
                        <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                </div>
            `;
        }).join('');
        
        elements.placeOrderBtn.disabled = !elements.unitNumber.value.trim();
    }
}

// ========================================
// EDIT MODAL FUNCTIONS
// ========================================
function openEditModal(itemId) {
    const item = menuItems.find(m => m.id === parseInt(itemId));
    const cartItem = cart[itemId];
    
    if (!item || !cartItem) return;
    
    editingItemId = itemId;
    elements.editItemName.textContent = item.name;
    elements.editQuantity.textContent = cartItem.quantity;
    elements.editNotes.value = cartItem.notes || '';
    
    elements.editModal.classList.remove('hidden');
}

function closeEditModal() {
    elements.editModal.classList.add('hidden');
    editingItemId = null;
}

function updateEditQuantity(change) {
    const currentQty = parseInt(elements.editQuantity.textContent);
    const newQty = Math.max(0, currentQty + change);
    elements.editQuantity.textContent = newQty;
}

function saveEditChanges() {
    if (!editingItemId) return;
    
    const newQuantity = parseInt(elements.editQuantity.textContent);
    const newNotes = elements.editNotes.value.trim();
    
    if (newQuantity === 0) {
        delete cart[editingItemId];
    } else {
        cart[editingItemId].quantity = newQuantity;
        cart[editingItemId].notes = newNotes;
    }
    
    renderMenu();
    renderCart();
    updateCartSummary();
    closeEditModal();
}

function removeItemFromModal() {
    if (!editingItemId) return;
    
    if (confirm('Remove this item from your cart?')) {
        delete cart[editingItemId];
        renderMenu();
        renderCart();
        updateCartSummary();
        closeEditModal();
    }
}

// ========================================
// ITEM DETAIL MODAL FUNCTIONS
// ========================================
let detailItemId = null;

function openItemDetail(itemId) {
    const item = menuItems.find(m => String(m.id) === String(itemId));
    if (!item) return;

    detailItemId = itemId;
    elements.detailName.textContent = item.name;
    elements.detailImage.src = item.image_url || '/static/images/placeholder.png';
    elements.detailImage.alt = item.name;
    elements.detailDescription.textContent = item.description || '';
    elements.detailPrice.textContent = formatPrice(item.price);

    elements.itemDetailModal.classList.remove('hidden');
}

function closeItemDetail() {
    elements.itemDetailModal.classList.add('hidden');
    detailItemId = null;
}

// ========================================
// NAVIGATION FUNCTIONS
// ========================================
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
    window.scrollTo(0, 0);
}

// ========================================
// ORDER FUNCTIONS
// ========================================
async function placeOrder() {
    // Re-check restaurant status before placing order
    await checkRestaurantStatus();
    if (restaurantSettings && !restaurantSettings.accepting_orders) {
        alert('Sorry, the restaurant is not accepting orders right now. Please try again later.');
        return;
    }

    const unitNumber = elements.unitNumber.value.trim().toUpperCase();
    const phoneNumber = elements.phoneNumber.value.trim();
    const deliveryNotes = elements.deliveryNotes.value.trim();

    if (!unitNumber) {
        alert('Please enter your unit number');
        return;
    }

    const orderItems = Object.entries(cart)
        .filter(([_, item]) => item.quantity > 0)
        .map(([id, item]) => {
            const menuItem = menuItems.find(m => String(m.id) === String(id));
            return {
                id: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                notes: item.notes
            };
        });

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Disable button while sending
    elements.placeOrderBtn.disabled = true;
    elements.placeOrderBtn.textContent = 'Placing order...';

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                unit_number: unitNumber,
                phone_number: phoneNumber || null,
                delivery_notes: deliveryNotes || null,
                items: orderItems,
                total
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to place order');
        }

        const order = await res.json();

        // Save tracking token for persistence across refreshes
        localStorage.setItem(TRACKING_KEY, order.tracking_token);

        currentOrder = {
            trackingToken: order.tracking_token,
            orderNumber: order.order_number,
            unitNumber: order.unit_number,
            items: order.items,
            total: order.total,
            status: order.status
        };

        // Reset cart and form
        cart = {};
        elements.unitNumber.value = '';
        elements.phoneNumber.value = '';
        elements.deliveryNotes.value = '';
        updateCartSummary();
        renderMenu();

        // Show status screen and start polling
        showScreen('status');
        renderOrderStatus();
        startStatusPolling();
    } catch (err) {
        alert(err.message || 'Something went wrong. Please try again.');
    } finally {
        elements.placeOrderBtn.disabled = false;
        elements.placeOrderBtn.textContent = 'Place Order';
    }
}

const STATUS_MAP = {
    'new':       { step: 1, text: 'Order Received',  icon: '📋', message: 'Your order has been received!' },
    'preparing': { step: 2, text: 'Preparing Your Order', icon: '🍳', message: 'The kitchen is working on it!' },
    'ready':     { step: 3, text: 'Ready for Delivery', icon: '✅', message: 'Your order is ready!' },
    'delivered': { step: 4, text: 'Delivered',        icon: '🍽️', message: 'Enjoy your meal!' }
};

let statusPollTimer = null;

function renderOrderStatus() {
    elements.orderNumber.textContent = currentOrder.orderNumber;
    elements.deliveryUnit.textContent = currentOrder.unitNumber;

    // Dynamic prep time from restaurant settings
    if (restaurantSettings && restaurantSettings.prep_time_minutes) {
        const min = restaurantSettings.prep_time_minutes;
        const max = min + 10;
        elements.estTime.textContent = `${min}-${max} min`;
    }

    elements.orderItemsList.innerHTML = currentOrder.items.map(item => `
        <div class="order-item-line">
            <span><span class="qty">${item.quantity}×</span> ${item.name}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    elements.newOrderBtn.classList.add('hidden');
    applyStatusUI(currentOrder.status);
}

function applyStatusUI(status) {
    const info = STATUS_MAP[status];
    if (!info) return;
    updateStatusUI(info.step, info.text, info.icon, info.message);

    if (status === 'delivered') {
        elements.newOrderBtn.classList.remove('hidden');
    }
}

function startStatusPolling() {
    if (statusPollTimer) clearInterval(statusPollTimer);

    statusPollTimer = setInterval(async () => {
        if (!currentOrder || !currentOrder.trackingToken) {
            clearInterval(statusPollTimer);
            return;
        }

        try {
            const res = await fetch(`/api/orders/track/${currentOrder.trackingToken}`);
            if (!res.ok) return;

            const order = await res.json();
            currentOrder.status = order.status;
            applyStatusUI(order.status);

            if (order.status === 'delivered') {
                clearInterval(statusPollTimer);
                statusPollTimer = null;
            }
        } catch {
            // Silently retry on next interval
        }
    }, 5000);
}

function updateStatusUI(step, text, icon, message) {
    elements.statusText.textContent = text;
    elements.statusIcon.textContent = icon;
    elements.statusMessage.textContent = message;
    
    // Update progress bar
    const progress = ((step - 1) / 3) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // Update steps
    document.querySelectorAll('.p-step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');
        
        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = searchInput.value.trim();
            renderMenu();
        }, 200);
    });

    // Category tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => filterMenu(btn.dataset.category));
    });
    
    // Menu item actions
    elements.menuItems.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action="add"]');
        if (btn) {
            addToCart(btn.dataset.id);
            return;
        }
        const card = e.target.closest('.food-card');
        if (card) {
            openItemDetail(card.dataset.id);
        }
    });
    
    // Cart item actions
    elements.cartItems.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        const cartItem = e.target.closest('.cart-item');
        
        if (btn) {
            const itemId = btn.dataset.id;
            const action = btn.dataset.action;
            
            if (action === 'increase') {
                addToCart(itemId);
            } else if (action === 'decrease') {
                removeFromCart(itemId);
            }
        } else if (cartItem) {
            // Open edit modal when clicking on cart item
            const itemId = cartItem.dataset.id;
            openEditModal(itemId);
        }
    });
    
    // Navigation
    elements.viewCartBtn.addEventListener('click', () => {
        renderCart();
        showScreen('cart');
    });
    
    elements.backToMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    elements.browseMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    elements.newOrderBtn.addEventListener('click', () => {
        if (statusPollTimer) {
            clearInterval(statusPollTimer);
            statusPollTimer = null;
        }
        localStorage.removeItem(TRACKING_KEY);
        currentOrder = null;
        cart = {};
        renderMenu();
        updateCartSummary();
        showScreen('menu');
    });
    
    elements.clearCartBtn.addEventListener('click', clearCart);
    
    // Place order
    elements.placeOrderBtn.addEventListener('click', placeOrder);
    
    // Unit number validation
    elements.unitNumber.addEventListener('input', () => {
        const hasItems = Object.keys(cart).length > 0;
        elements.placeOrderBtn.disabled = !elements.unitNumber.value.trim() || !hasItems;
    });
    
    // Modal actions
    elements.closeModalBtn.addEventListener('click', closeEditModal);
    elements.modalOverlay.addEventListener('click', closeEditModal);
    
    elements.qtyDecreaseBtn.addEventListener('click', () => updateEditQuantity(-1));
    elements.qtyIncreaseBtn.addEventListener('click', () => updateEditQuantity(1));
    
    elements.removeItemBtn.addEventListener('click', removeItemFromModal);
    elements.saveChangesBtn.addEventListener('click', saveEditChanges);

    // Detail modal actions
    elements.detailCloseBtn.addEventListener('click', closeItemDetail);
    elements.detailOverlay.addEventListener('click', closeItemDetail);
    elements.detailAddBtn.addEventListener('click', () => {
        if (detailItemId) {
            addToCart(detailItemId);
            closeItemDetail();
        }
    });
}

// Start the app
init();