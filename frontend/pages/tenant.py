from fasthtml.common import *

def tenant_page():
    return Html(
    Head(
        Meta(charset='UTF-8'),
        Meta(name='viewport', content='width=device-width, initial-scale=1.0'),
        Title('Zitan - Order Food'),
        Link(rel='stylesheet', href='static/css/tenant.css'),
        Base(target='_blank')
    ),
    Body(
        Div(
            Header(
                Div(
                    Div(
                        Img(
                            src="static/image/logs.png",
                            alt="Zitan Logo",
                            cls="app-logo"
                        ),
                        Div(
                            H1("The Zitan"),
                            P("In-House Restaurant Delivery", cls="subtitle"),
                            cls="brand-text"
                        ),
                        cls="header-top"
                    ),
                    Div(
                        Div(
                            Span('', cls='search-icon'),
                            Input(
                                type='text',
                                id='search-input',
                                placeholder='Search menu...',
                                autocomplete='off'
                            ),
                            cls='search-bar'
                        ),
                        cls="header-search"
                    ),
                    cls="header-content"
                ),
                cls="app-header"
            ),
            Div(
                P('We are not accepting orders right now. Please check back later.'),
                id='paused-banner',
                cls='paused-banner hidden'
            ),
            Main(
                Div(
                    Div(
                        id='category-tabs',
                        cls='category-tabs'
                    ),
                    cls='sticky-nav'
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
            Div(
                Div(
                    Div(
                        Div(
                            Div('1', cls='wizard-dot active'),
                            Span('Review'),
                            cls='wizard-indicator active',
                            data_step='1'
                        ),
                        Div(cls='wizard-line'),
                        Div(
                            Div('2', cls='wizard-dot'),
                            Span('Details'),
                            cls='wizard-indicator',
                            data_step='2'
                        ),
                        Div(cls='wizard-line'),
                        Div(
                            Div('3', cls='wizard-dot'),
                            Span('Preferences'),
                            cls='wizard-indicator',
                            data_step='3'
                        ),
                        Div(cls='wizard-line'),
                        Div(
                            Div('4', cls='wizard-dot'),
                            Span('Payment'),
                            cls='wizard-indicator',
                            data_step='4'
                        ),
                        cls='wizard-indicators'
                    ),
                    cls='wizard-header'
                ),
                id='wizard-header-wrap',
                cls='hidden'
            ),
            Main(
                Div(
                    Div('🛒', cls='empty-icon'),
                    H3('Your cart is empty'),
                    P('Add some delicious food to get started!'),
                    Button('Browse Menu', id='browse-menu-btn', cls='btn-primary'),
                    cls='cart-empty-state hidden'
                ),
                Div(
                    Div(
                        Div(
                            id='cart-items',
                            cls='cart-items'
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
                        data_step='1',
                        cls='wizard-step active'
                    ),
                    Div(
                        Div(
                            H3('Order Type'),
                            Div(
                                Button(
                                    Span('🚚'),
                                    Span('Delivery'),
                                    id='btn-delivery',
                                    cls='order-type-option active',
                                    data_value='delivery'
                                ),
                                Button(
                                    Span('🏪'),
                                    Span('Pick Up'),
                                    id='btn-pickup',
                                    cls='order-type-option',
                                    data_value='pickup'
                                ),
                                cls='order-type-toggle'
                            ),
                            cls='order-type-section'
                        ),
                        Div(
                            H3('Delivery Details', id='details-heading'),
                            Div(
                                Label('Unit Number *', fr='unit-number'),
                                Input(type='text', id='unit-number', placeholder='e.g., 12A', maxlength='10'),
                                cls='input-group'
                            ),
                            Div(
                                Label('Contact Method (optional)'),
                                Div(
                                    Button('Phone', id='btn-contact-phone',
                                           cls='contact-option active', data_value='phone'),
                                    Button('Email', id='btn-contact-email',
                                           cls='contact-option', data_value='email'),
                                    cls='contact-toggle'
                                ),
                                Div(
                                    Div(
                                        Span('+63', cls='phone-prefix'),
                                        Input(type='tel', id='phone-number',
                                              placeholder='9XX XXX XXXX', maxlength='12'),
                                        cls='phone-input-wrap'
                                    ),
                                    id='contact-phone-group'
                                ),
                                Div(
                                    Input(type='email', id='email-address',
                                          placeholder='you@example.com'),
                                    id='contact-email-group',
                                    cls='hidden'
                                ),
                                cls='input-group'
                            ),
                            Div(
                                Label('Delivery Notes (optional)', fr='delivery-notes', id='notes-label'),
                                Textarea(id='delivery-notes', rows='2', placeholder='Any special instructions...'),
                                cls='input-group',
                                id='notes-group'
                            ),
                            cls='delivery-section'
                        ),
                        data_step='2',
                        cls='wizard-step'
                    ),
                    Div(
                        Div(
                            Div(
                                Span('⚠️', cls='warning-icon'),
                                H3('Food Allergy Warning'),
                                cls='allergy-header'
                            ),
                            P(
                                'Food prepared here may contain or have come in contact with milk, wheat, soybeans, peanuts, tree nuts or eggs. If you have food allergy, kindly ask our staff about the ingredients in your meals/drinks before placing your order.',
                                cls='allergy-text'
                            ),
                            Div(
                                Input(type='checkbox', id='allergen-ack'),
                                Label(
                                    'I have read, understood and acknowledge the presence of allergens in meals/drinks served from this store.',
                                    fr='allergen-ack'
                                ),
                                cls='allergy-checkbox'
                            ),
                            cls='allergy-warning'
                        ),
                        Div(
                            H3('Order Requests'),
                            Div(
                                Div(
                                    Span('🍴', cls='cutlery-icon'),
                                    Div(
                                        P('Cutlery', cls='cutlery-label'),
                                        P('Request for cutlery only if you need it. Thank you for being environmentally friendly.', cls='cutlery-desc'),
                                        cls='cutlery-text'
                                    ),
                                    cls='cutlery-info'
                                ),
                                Div(
                                    Button('No Cutlery', id='btn-no-cutlery', cls='cutlery-option active', data_value='none'),
                                    Button('With Cutlery', id='btn-with-cutlery', cls='cutlery-option', data_value='with'),
                                    cls='cutlery-toggle'
                                ),
                                cls='cutlery-request'
                            ),
                            cls='order-requests'
                        ),
                        data_step='3',
                        cls='wizard-step'
                    ),
                    Div(
                        Div(
                            H3('Payment Method'),
                            Div(
                                Button(
                                    Span('💵'),
                                    Span('Cash'),
                                    id='btn-cash',
                                    cls='payment-option active',
                                    data_value='cash'
                                ),
                                Button(
                                    Span('📱'),
                                    Span('GCash'),
                                    id='btn-gcash',
                                    cls='payment-option',
                                    data_value='gcash'
                                ),
                                cls='payment-toggle'
                            ),
                            Div(
                                P('Pay with cash upon delivery/pick up.', id='cash-note'),
                                cls='payment-note',
                                id='cash-info'
                            ),
                            Div(
                                P('Send your payment via GCash to:', cls='gcash-instruction'),
                                Div(
                                    P('GCash Number', cls='gcash-label'),
                                    P('0917 XXX XXXX', id='gcash-number', cls='gcash-value'),
                                    P('Zitan Restaurant', cls='gcash-name'),
                                    cls='gcash-details'
                                ),
                                P('Please send the exact amount and keep your receipt.', cls='gcash-reminder'),
                                Div(
                                    Label('GCash Reference Number *', fr='gcash-ref'),
                                    Input(type='text', id='gcash-ref', placeholder='e.g., 1234 567 890', maxlength='20'),
                                    cls='gcash-ref-group'
                                ),
                                cls='payment-note hidden',
                                id='gcash-info'
                            ),
                            cls='payment-section'
                        ),
                        Button('Place Order', id='place-order-btn', disabled='', cls='btn-primary btn-large'),
                        data_step='4',
                        cls='wizard-step'
                    ),
                    id='wizard-steps',
                    cls='wizard-steps'
                ),
                Div(
                    Button('Back', id='wizard-back-btn', cls='btn-secondary'),
                    Button('Next', id='wizard-next-btn', cls='btn-primary'),
                    id='wizard-nav',
                    cls='wizard-nav hidden'
                ),
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
                        Span('Order Type'),
                        Strong('Delivery', id='status-order-type'),
                        cls='info-row'
                    ),
                    Div(
                        Span('Delivering to', id='status-unit-label'),
                        Strong('--', id='delivery-unit'),
                        cls='info-row'
                    ),
                    Div(
                        Span('Payment'),
                        Strong('Cash', id='status-payment'),
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