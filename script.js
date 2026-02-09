// ========================================
// THE GARDEN BISTRO - FOOD ORDERING APP
// ========================================

// Menu Data with Categories and Emojis
const menuItems = [
    {
        id: 1,
        name: "Grilled Chicken Rice",
        description: "Tender grilled chicken with fragrant jasmine rice",
        price: 8.50,
        category: "mains",
        emoji: "🍗"
    },
    {
        id: 2,
        name: "Vegetable Noodles",
        description: "Fresh veggies with egg noodles in light sauce",
        price: 6.50,
        category: "mains",
        emoji: "🍜"
    },
    {
        id: 3,
        name: "Fish & Chips",
        description: "Crispy battered fish with golden fries",
        price: 10.00,
        category: "mains",
        emoji: "🐟"
    },
    {
        id: 4,
        name: "Beef Burger",
        description: "Juicy beef patty with fresh lettuce and tomato",
        price: 9.00,
        category: "mains",
        emoji: "🍔"
    },
    {
        id: 5,
        name: "Caesar Salad",
        description: "Crisp romaine with parmesan and croutons",
        price: 7.00,
        category: "sides",
        emoji: "🥗"
    },
    {
        id: 6,
        name: "Tomato Soup",
        description: "Warm creamy soup with garlic bread",
        price: 5.50,
        category: "sides",
        emoji: "🥣"
    },
    {
        id: 7,
        name: "French Fries",
        description: "Golden crispy fries with ketchup",
        price: 3.50,
        category: "sides",
        emoji: "🍟"
    },
    {
        id: 8,
        name: "Iced Lemon Tea",
        description: "Refreshing tea with fresh lemon",
        price: 2.50,
        category: "drinks",
        emoji: "🍵"
    },
    {
        id: 9,
        name: "Fresh Orange Juice",
        description: "100% freshly squeezed oranges",
        price: 3.50,
        category: "drinks",
        emoji: "🧃"
    },
    {
        id: 10,
        name: "Mineral Water",
        description: "Chilled bottled water",
        price: 1.50,
        category: "drinks",
        emoji: "💧"
    }
];

// App State
let cart = {}; // { itemId: { quantity, notes } }
let currentCategory = 'all';
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
    statusIcon: document.getElementById('status-icon'),
    statusText: document.getElementById('status-text'),
    statusMessage: document.getElementById('status-message'),
    progressFill: document.getElementById('progress-fill')
};

// ========================================
// INITIALIZATION
// ========================================
function init() {
    renderMenu();
    setupEventListeners();
}

// ========================================
// MENU FUNCTIONS
// ========================================
function renderMenu() {
    const filteredItems = currentCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === currentCategory);
    
    elements.menuItems.innerHTML = filteredItems.map(item => {
        const cartItem = cart[item.id];
        const quantity = cartItem ? cartItem.quantity : 0;
        
        return `
            <div class="food-card" data-id="${item.id}">
                <div class="food-image">${item.emoji}</div>
                <div class="food-info">
                    <h3 class="food-name">${item.name}</h3>
                    <p class="food-description">${item.description}</p>
                    <p class="food-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="food-actions">
                    ${quantity > 0 ? `<span class="quantity-badge">${quantity}</span>` : ''}
                    <button class="btn-add" data-id="${item.id}" data-action="add">+</button>
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
            const menuItem = menuItems.find(m => m.id === parseInt(id));
            totalItems += item.quantity;
            totalPrice += menuItem.price * item.quantity;
        }
    });
    
    return { totalItems, totalPrice };
}

function updateCartSummary() {
    const { totalItems, totalPrice } = getCartTotals();
    
    elements.cartCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    elements.cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    elements.subtotal.textContent = `$${totalPrice.toFixed(2)}`;
    elements.cartTotalLarge.textContent = `$${totalPrice.toFixed(2)}`;
    
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
            const item = menuItems.find(m => m.id === parseInt(id));
            const cartItem = cart[id];
            const itemTotal = item.price * cartItem.quantity;
            
            return `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">${item.emoji}</div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        ${cartItem.notes ? `<p class="cart-item-notes">"${cartItem.notes}"</p>` : ''}
                        <p class="cart-item-price">$${itemTotal.toFixed(2)}</p>
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
function placeOrder() {
    const unitNumber = elements.unitNumber.value.trim().toUpperCase();
    const phoneNumber = elements.phoneNumber.value.trim();
    const deliveryNotes = elements.deliveryNotes.value.trim();
    
    if (!unitNumber) {
        alert('Please enter your unit number');
        return;
    }
    
    const orderItems = Object.entries(cart)
        .filter(([_, item]) => item.quantity > 0)
        .map(([id, item]) => ({
            ...menuItems.find(m => m.id === parseInt(id)),
            quantity: item.quantity,
            notes: item.notes
        }));
    
    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    currentOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        unitNumber,
        phoneNumber,
        deliveryNotes,
        items: orderItems,
        total,
        status: 'preparing',
        statusStep: 1,
        placedAt: new Date()
    };
    
    // Reset cart
    cart = {};
    elements.unitNumber.value = '';
    elements.phoneNumber.value = '';
    elements.deliveryNotes.value = '';
    renderMenu();
    
    // Show status screen
    showScreen('status');
    startStatusSimulation();
}

function startStatusSimulation() {
    // Set order details
    elements.orderNumber.textContent = currentOrder.id;
    elements.deliveryUnit.textContent = currentOrder.unitNumber;
    
    // Render order items
    elements.orderItemsList.innerHTML = currentOrder.items.map(item => `
        <div class="order-item-line">
            <span><span class="qty">${item.quantity}×</span> ${item.name}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    // Reset UI
    elements.newOrderBtn.classList.add('hidden');
    updateStatusUI(1, 'Preparing Your Order', '🍳', 'The kitchen is working on it!');
    
    // Simulate status changes
    const statusUpdates = [
        { 
            step: 2, 
            text: 'Ready for Pickup', 
            icon: '✅', 
            message: 'Your order is ready!',
            delay: 6000 
        },
        { 
            step: 3, 
            text: 'On the Way', 
            icon: '🛵', 
            message: 'Delivery is on the way to your unit',
            delay: 10000 
        },
        { 
            step: 4, 
            text: 'Delivered', 
            icon: '🍽️', 
            message: 'Enjoy your meal!',
            delay: 15000 
        }
    ];
    
    statusUpdates.forEach(({ step, text, icon, message, delay }) => {
        setTimeout(() => {
            currentOrder.statusStep = step;
            currentOrder.status = text.toLowerCase().replace(/ /g, '-');
            updateStatusUI(step, text, icon, message);
            
            if (step === 4) {
                elements.newOrderBtn.classList.remove('hidden');
            }
        }, delay);
    });
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
    // Category tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => filterMenu(btn.dataset.category));
    });
    
    // Menu item actions
    elements.menuItems.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const itemId = parseInt(btn.dataset.id);
        addToCart(itemId);
    });
    
    // Cart item actions
    elements.cartItems.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        const cartItem = e.target.closest('.cart-item');
        
        if (btn) {
            const itemId = parseInt(btn.dataset.id);
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
}

// Start the app
init();