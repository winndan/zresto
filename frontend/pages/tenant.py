from fasthtml.common import *

def tenant_page():
    return Html(
    Head(
        Meta(charset='UTF-8'),
        Meta(name='viewport', content='width=device-width, initial-scale=1.0'),
        Title('The Garden Bistro - Order Food'),
        Link(rel='stylesheet', href='static/css/tenant.css'),
        Base(target='_blank')
    ),
    Body(
        Div(
            Div(
                Img(
                    src="static/image/logo.png",
                    alt="The Garden Bistro Logo",
                    cls="app-logo"
                ),
                Div(
                    H1("The Garden Bistro"),
                    P("In-House Restaurant Delivery", cls="subtitle"),
                    cls="brand-text"
                ),
                cls="header-content"
            ),
            Div(
                P('We are not accepting orders right now. Please check back later.'),
                id='paused-banner',
                cls='paused-banner hidden'
            ),
            Main(
                Div(
                    Button(Span('🍽️'), Span('All'), data_category='all', cls='tab-btn active'),
                    Button(Span('🍛'), Span('Mains'), data_category='mains', cls='tab-btn'),
                    Button(Span('🥗'), Span('Sides'), data_category='sides', cls='tab-btn'),
                    Button(Span('🥤'), Span('Drinks'), data_category='drinks', cls='tab-btn'),
                    cls='category-tabs'
                ),

                Div(
                    id='menu-items',
                    cls='menu-grid'
                ),
                cls='menu-container'
            ),
            Div(
                Div(
                    Div('🛒', cls='cart-icon'),
                    Div(
                        Span('0 items', id='cart-count'),
                        Span('₱0.00', id='cart-total'),
                        cls='cart-info'
                    ),
                    cls='cart-preview'
                ),
                Button('View Order →', id='view-cart-btn', cls='btn-primary'),
                id='cart-summary',
                cls='cart-summary hidden'
            ),
            id='menu-screen',
            cls='screen active'
        ),
        Div(
            Header(
                Button(
                    Span('←', cls='back-arrow'),
                    Span('Menu'),
                    id='back-to-menu',
                    cls='btn-back'
                ),
                H2('Your Order'),
                Button('Clear All', id='clear-cart-btn', cls='btn-text'),
                cls='screen-header'
            ),
            Main(
                Div(
                    id='cart-items',
                    cls='cart-items'
                ),
                Div(
                    Div('🛒', cls='empty-icon'),
                    H3('Your cart is empty'),
                    P('Add some delicious food to get started!'),
                    Button('Browse Menu', id='browse-menu-btn', cls='btn-primary'),
                    cls='cart-empty-state hidden'
                ),
                Div(
                    Div(
                        Span('Subtotal'),
                        Span('₱0.00', id='subtotal'),
                        cls='summary-row'
                    ),
                    Div(
                        Span('Delivery Fee'),
                        Span('FREE', cls='free'),
                        cls='summary-row'
                    ),
                    Div(
                        Span('Total'),
                        Span('₱0.00', id='cart-total-large'),
                        cls='summary-row total'
                    ),
                    cls='cart-summary-box'
                ),
                Div(
                    H3('Delivery Details'),
                    Div(
                        Label('Unit Number *', fr='unit-number'),
                        Input(type='text', id='unit-number', placeholder='e.g., 12A', maxlength='10'),
                        cls='input-group'
                    ),
                    Div(
                        Label('Phone Number (optional)', fr='phone-number'),
                        Input(type='tel', id='phone-number', placeholder='For delivery contact'),
                        cls='input-group'
                    ),
                    Div(
                        Label('Delivery Notes (optional)', fr='delivery-notes'),
                        Textarea(id='delivery-notes', rows='2', placeholder='Any special instructions...'),
                        cls='input-group'
                    ),
                    cls='delivery-section'
                ),
                Button('Place Order', id='place-order-btn', disabled='', cls='btn-primary btn-large'),
                cls='cart-container'
            ),
            id='cart-screen',
            cls='screen'
        ),
        Div(
            Header(
                H2('Order Status'),
                cls='screen-header center'
            ),
            Main(
                Div(
                    Div('🍳', id='status-icon', cls='status-icon-large'),
                    H3('Preparing Your Order', id='status-text', cls='status-title'),
                    P('The kitchen is working on it!', id='status-message', cls='status-message'),
                    cls='status-card'
                ),
                Div(
                    Div(
                        Div(id='progress-fill', style='width: 0%', cls='progress-fill'),
                        cls='progress-line'
                    ),
                    Div(
                        Div(
                            Div('1', cls='p-dot'),
                            Span('Preparing'),
                            data_step='1',
                            cls='p-step active'
                        ),
                        Div(
                            Div('2', cls='p-dot'),
                            Span('Ready'),
                            data_step='2',
                            cls='p-step'
                        ),
                        Div(
                            Div('3', cls='p-dot'),
                            Span('On the way'),
                            data_step='3',
                            cls='p-step'
                        ),
                        Div(
                            Div('4', cls='p-dot'),
                            Span('Delivered'),
                            data_step='4',
                            cls='p-step'
                        ),
                        cls='progress-steps'
                    ),
                    cls='progress-track'
                ),
                Div(
                    Div(
                        Span('Order #'),
                        Strong('----', id='order-number'),
                        cls='info-row'
                    ),
                    Div(
                        Span('Delivering to'),
                        Strong('--', id='delivery-unit'),
                        cls='info-row'
                    ),
                    Div(
                        Span('Estimated time'),
                        Strong('20-30 min', id='est-time'),
                        cls='info-row'
                    ),
                    cls='order-info-card'
                ),
                Div(
                    H4('Your Order'),
                    Div(id='order-items-list'),
                    id='order-summary',
                    cls='order-summary-mini'
                ),
                Button('Order Again', id='new-order-btn', cls='btn-primary btn-large hidden'),
                cls='status-container'
            ),
            id='status-screen',
            cls='screen'
        ),
        Div(
            Div(cls='modal-overlay'),
            Div(
                Div(
                    H3('Item Name', id='edit-item-name'),
                    Button('×', id='close-modal', cls='btn-close'),
                    cls='modal-header'
                ),
                Div(
                    Div(
                        Button('−', id='qty-decrease', cls='btn-qty'),
                        Span('1', id='edit-quantity', cls='qty-display'),
                        Button('+', id='qty-increase', cls='btn-qty'),
                        cls='quantity-editor'
                    ),
                    Div(
                        Label('Special Instructions'),
                        Textarea(id='edit-notes', rows='3', placeholder='e.g., No onions, extra sauce...'),
                        cls='edit-notes'
                    ),
                    cls='modal-body'
                ),
                Div(
                    Button('Remove Item', id='remove-item-btn', cls='btn-danger'),
                    Button('Save Changes', id='save-changes-btn', cls='btn-primary'),
                    cls='modal-footer'
                ),
                cls='modal-content'
            ),
            id='edit-modal',
            cls='modal hidden'
        ),
        Div(
            Div(cls='modal-overlay', id='detail-overlay'),
            Div(
                Div(
                    H3('Item Name', id='detail-item-name'),
                    Button('×', id='close-detail', cls='btn-close'),
                    cls='modal-header'
                ),
                Div(
                    Div(
                        Img(src='', alt='', id='detail-image'),
                        cls='detail-image'
                    ),
                    P('', id='detail-description', cls='detail-description'),
                    P('', id='detail-price', cls='detail-price'),
                    cls='modal-body'
                ),
                Div(
                    Button('Add to Cart', id='detail-add-btn', cls='btn-primary btn-large'),
                    cls='modal-footer'
                ),
                cls='modal-content'
            ),
            id='item-detail-modal',
            cls='modal hidden'
        ),
        Script(src='static/js/tenant.js')
    ),
    lang='en'
)