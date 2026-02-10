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
let menuCategories = [];
let restaurantSettings = null;

async function fetchMenuItems() {
    const res = await fetch("/api/menu");
    if (!res.ok) {
        console.error("Failed to fetch menu items");
        return [];
    }
    return await res.json();
}

async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
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
let contactMethod = 'phone'; // 'phone' or 'email'
let cutleryPreference = 'none'; // 'none' or 'with'
let orderType = 'delivery'; // 'delivery' or 'pickup'
let paymentMethod = 'cash'; // 'cash' or 'gcash'
let currentWizardStep = 1;
const WIZARD_TOTAL_STEPS = 4;

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
    emailAddress: document.getElementById('email-address'),
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
    menuCategories = await fetchCategories();
    renderCategoryTabs();
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
                        status: order.status,
                        orderType: order.order_type || 'delivery',
                        paymentMethod: order.payment_method || 'cash'
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
// CATEGORY TABS
// ========================================
function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;

    let html = `<button class="tab-btn active" data-category="all"><span>🍽️</span><span>All</span></button>`;
    menuCategories.forEach(cat => {
        html += `<button class="tab-btn" data-category="${cat.name}"><span>${cat.emoji || ''}</span><span>${cat.display_name}</span></button>`;
    });
    container.innerHTML = html;
}

// ========================================
// MENU FUNCTIONS
// ========================================
function renderMenu() {
    // When searching, ignore category filter so results come from all categories
    let filteredItems;
    if (searchQuery) {
        filteredItems = menuItems;
    } else {
        filteredItems = currentCategory === 'all'
            ? menuItems
            : menuItems.filter(item => item.category === currentCategory);
    }

    if (searchQuery) {
        const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        filteredItems = filteredItems.filter(item => {
            const haystack = (item.name + ' ' + (item.description || '') + ' ' + (item.category || '')).toLowerCase();
            return tokens.every(t => haystack.includes(t));
        });
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
    const tabContainer = document.getElementById('category-tabs');
    if (tabContainer) {
        tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }

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
        showWizardUI(false);
    } else {
        elements.cartItems.classList.remove('hidden');
        elements.cartEmptyState.classList.add('hidden');
        showWizardUI(true);

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

        const gcashValid = paymentMethod !== 'gcash' || document.getElementById('gcash-ref').value.trim();
        elements.placeOrderBtn.disabled = !elements.unitNumber.value.trim() || !document.getElementById('allergen-ack').checked || !gcashValid;
    }
}

function updatePlaceOrderState() {
    const hasItems = Object.keys(cart).some(id => cart[id].quantity > 0);
    const unitFilled = elements.unitNumber.value.trim();
    const allergenChecked = document.getElementById('allergen-ack').checked;
    const gcashValid = paymentMethod !== 'gcash' || document.getElementById('gcash-ref').value.trim();
    elements.placeOrderBtn.disabled = !hasItems || !unitFilled || !allergenChecked || !gcashValid;
}

// ========================================
// WIZARD FUNCTIONS
// ========================================
const wizardElements = {
    headerWrap: document.getElementById('wizard-header-wrap'),
    stepsContainer: document.getElementById('wizard-steps'),
    nav: document.getElementById('wizard-nav'),
    backBtn: document.getElementById('wizard-back-btn'),
    nextBtn: document.getElementById('wizard-next-btn'),
    indicators: document.querySelectorAll('.wizard-indicator'),
    dots: document.querySelectorAll('.wizard-dot'),
    lines: document.querySelectorAll('.wizard-line')
};

function goToWizardStep(step) {
    currentWizardStep = step;

    // Show/hide steps
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.step) === step);
    });

    // Update indicators
    wizardElements.indicators.forEach(ind => {
        const s = parseInt(ind.dataset.step);
        ind.classList.remove('active', 'completed');
        ind.querySelector('.wizard-dot').classList.remove('active', 'completed');
        if (s === step) {
            ind.classList.add('active');
            ind.querySelector('.wizard-dot').classList.add('active');
        } else if (s < step) {
            ind.classList.add('completed');
            ind.querySelector('.wizard-dot').classList.add('completed');
        }
    });

    // Update lines
    wizardElements.lines.forEach((line, i) => {
        // line i sits between step i+1 and step i+2
        line.classList.toggle('completed', (i + 1) < step);
    });

    // Back button visibility
    if (step === 1) {
        wizardElements.backBtn.classList.add('hidden');
    } else {
        wizardElements.backBtn.classList.remove('hidden');
    }

    // Next button: hide on last step (Place Order button is there)
    if (step === WIZARD_TOTAL_STEPS) {
        wizardElements.nextBtn.classList.add('hidden');
    } else {
        wizardElements.nextBtn.classList.remove('hidden');
    }

    // Show nav (Back visible from step 2, Next visible until step 3)
    if (step === WIZARD_TOTAL_STEPS && step === 1) {
        wizardElements.nav.classList.add('hidden');
    } else {
        wizardElements.nav.classList.remove('hidden');
    }

    window.scrollTo(0, 0);
}

function validateWizardStep(step) {
    switch (step) {
        case 1: {
            const hasItems = Object.keys(cart).some(id => cart[id].quantity > 0);
            if (!hasItems) {
                alert('Your cart is empty. Add some items first.');
                return false;
            }
            return true;
        }
        case 2: {
            const unit = elements.unitNumber.value.trim();
            if (!unit) {
                alert('Please enter your unit number.');
                elements.unitNumber.focus();
                return false;
            }
            return true;
        }
        case 3: {
            const checked = document.getElementById('allergen-ack').checked;
            if (!checked) {
                alert('Please acknowledge the food allergy warning before continuing.');
                return false;
            }
            return true;
        }
        default:
            return true;
    }
}

function wizardNext() {
    if (!validateWizardStep(currentWizardStep)) return;
    if (currentWizardStep < WIZARD_TOTAL_STEPS) {
        goToWizardStep(currentWizardStep + 1);
    }
}

function wizardBack() {
    if (currentWizardStep > 1) {
        goToWizardStep(currentWizardStep - 1);
    }
}

function showWizardUI(show) {
    if (show) {
        wizardElements.headerWrap.classList.remove('hidden');
        wizardElements.stepsContainer.classList.remove('hidden');
        wizardElements.nav.classList.remove('hidden');
        goToWizardStep(currentWizardStep);
    } else {
        wizardElements.headerWrap.classList.add('hidden');
        wizardElements.stepsContainer.classList.add('hidden');
        wizardElements.nav.classList.add('hidden');
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
    if (screenName === 'cart') {
        goToWizardStep(1);
    }
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
    const rawPhone = elements.phoneNumber.value.trim().replace(/\s+/g, '');
    const phoneNumber = (contactMethod === 'phone' && rawPhone)
        ? (rawPhone.startsWith('+') ? rawPhone : '+63' + rawPhone.replace(/^0/, ''))
        : '';
    const emailValue = (contactMethod === 'email') ? elements.emailAddress.value.trim() : '';
    const deliveryNotes = elements.deliveryNotes.value.trim();

    if (!unitNumber) {
        alert('Please enter your unit number');
        return;
    }

    if (!document.getElementById('allergen-ack').checked) {
        alert('Please acknowledge the food allergy warning before placing your order.');
        return;
    }

    const gcashRef = document.getElementById('gcash-ref').value.trim();
    if (paymentMethod === 'gcash' && !gcashRef) {
        alert('Please enter your GCash reference number.');
        document.getElementById('gcash-ref').focus();
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
                email: emailValue || null,
                delivery_notes: deliveryNotes || null,
                cutlery: cutleryPreference === 'with',
                order_type: orderType,
                payment_method: paymentMethod,
                gcash_ref: paymentMethod === 'gcash' ? gcashRef : null,
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
            status: order.status,
            orderType: order.order_type || 'delivery',
            paymentMethod: order.payment_method || 'cash'
        };

        // Reset cart and form
        cart = {};
        elements.unitNumber.value = '';
        elements.phoneNumber.value = '';
        elements.emailAddress.value = '';
        contactMethod = 'phone';
        document.getElementById('btn-contact-phone').classList.add('active');
        document.getElementById('btn-contact-email').classList.remove('active');
        document.getElementById('contact-phone-group').classList.remove('hidden');
        document.getElementById('contact-email-group').classList.add('hidden');
        elements.deliveryNotes.value = '';
        document.getElementById('allergen-ack').checked = false;
        cutleryPreference = 'none';
        document.getElementById('btn-no-cutlery').classList.add('active');
        document.getElementById('btn-with-cutlery').classList.remove('active');
        orderType = 'delivery';
        document.getElementById('btn-delivery').classList.add('active');
        document.getElementById('btn-pickup').classList.remove('active');
        document.getElementById('details-heading').textContent = 'Delivery Details';
        document.getElementById('notes-group').classList.remove('hidden');
        paymentMethod = 'cash';
        document.getElementById('btn-cash').classList.add('active');
        document.getElementById('btn-gcash').classList.remove('active');
        document.getElementById('cash-info').classList.remove('hidden');
        document.getElementById('gcash-info').classList.add('hidden');
        document.getElementById('gcash-ref').value = '';
        currentWizardStep = 1;
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

    // Order type
    const isPickup = currentOrder.orderType === 'pickup';
    document.getElementById('status-order-type').textContent = isPickup ? 'Pick Up' : 'Delivery';
    document.getElementById('status-unit-label').textContent = isPickup ? 'Unit' : 'Delivering to';

    // Payment method
    const payLabel = currentOrder.paymentMethod === 'gcash' ? 'GCash' : 'Cash';
    document.getElementById('status-payment').textContent = payLabel;

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

    // Category tabs (delegated since tabs are dynamic)
    const tabContainer = document.getElementById('category-tabs');
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (btn) filterMenu(btn.dataset.category);
        });
    }
    
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
    
    // Wizard navigation
    wizardElements.nextBtn.addEventListener('click', wizardNext);
    wizardElements.backBtn.addEventListener('click', wizardBack);

    // Place order
    elements.placeOrderBtn.addEventListener('click', placeOrder);
    
    // Unit number validation
    elements.unitNumber.addEventListener('input', updatePlaceOrderState);

    // Allergen acknowledgment
    document.getElementById('allergen-ack').addEventListener('change', updatePlaceOrderState);

    // Contact method toggle
    document.getElementById('btn-contact-phone').addEventListener('click', () => {
        contactMethod = 'phone';
        document.getElementById('btn-contact-phone').classList.add('active');
        document.getElementById('btn-contact-email').classList.remove('active');
        document.getElementById('contact-phone-group').classList.remove('hidden');
        document.getElementById('contact-email-group').classList.add('hidden');
    });
    document.getElementById('btn-contact-email').addEventListener('click', () => {
        contactMethod = 'email';
        document.getElementById('btn-contact-email').classList.add('active');
        document.getElementById('btn-contact-phone').classList.remove('active');
        document.getElementById('contact-email-group').classList.remove('hidden');
        document.getElementById('contact-phone-group').classList.add('hidden');
    });

    // Order type toggle
    document.getElementById('btn-delivery').addEventListener('click', () => {
        orderType = 'delivery';
        document.getElementById('btn-delivery').classList.add('active');
        document.getElementById('btn-pickup').classList.remove('active');
        document.getElementById('details-heading').textContent = 'Delivery Details';
        document.getElementById('notes-group').classList.remove('hidden');
    });
    document.getElementById('btn-pickup').addEventListener('click', () => {
        orderType = 'pickup';
        document.getElementById('btn-pickup').classList.add('active');
        document.getElementById('btn-delivery').classList.remove('active');
        document.getElementById('details-heading').textContent = 'Pick Up Details';
        document.getElementById('notes-group').classList.add('hidden');
    });

    // Payment method toggle
    document.getElementById('btn-cash').addEventListener('click', () => {
        paymentMethod = 'cash';
        document.getElementById('btn-cash').classList.add('active');
        document.getElementById('btn-gcash').classList.remove('active');
        document.getElementById('cash-info').classList.remove('hidden');
        document.getElementById('gcash-info').classList.add('hidden');
        updatePlaceOrderState();
    });
    document.getElementById('btn-gcash').addEventListener('click', () => {
        paymentMethod = 'gcash';
        document.getElementById('btn-gcash').classList.add('active');
        document.getElementById('btn-cash').classList.remove('active');
        document.getElementById('gcash-info').classList.remove('hidden');
        document.getElementById('cash-info').classList.add('hidden');
        updatePlaceOrderState();
    });

    // GCash reference number validation
    document.getElementById('gcash-ref').addEventListener('input', updatePlaceOrderState);

    // Cutlery toggle
    document.getElementById('btn-no-cutlery').addEventListener('click', () => {
        cutleryPreference = 'none';
        document.getElementById('btn-no-cutlery').classList.add('active');
        document.getElementById('btn-with-cutlery').classList.remove('active');
    });
    document.getElementById('btn-with-cutlery').addEventListener('click', () => {
        cutleryPreference = 'with';
        document.getElementById('btn-with-cutlery').classList.add('active');
        document.getElementById('btn-no-cutlery').classList.remove('active');
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