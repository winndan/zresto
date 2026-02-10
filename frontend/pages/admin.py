from fasthtml.common import *


def admin_page():
    return Html(
        Head(
            Meta(charset='UTF-8'),
            Meta(name='viewport', content='width=device-width, initial-scale=1.0'),
            Title('Admin - The Zitan'),
            Link(rel='stylesheet', href='/static/css/admin.css'),
        ),
        Body(
            # Login overlay
            Div(
                Div(
                    H2('Admin Login'),
                    P('Enter the restaurant password to continue.'),
                    Div(
                        Input(
                            type='password',
                            id='admin-password',
                            placeholder='Password',
                            autocomplete='current-password',
                        ),
                        cls='input-group'
                    ),
                    P('', id='login-error', cls='login-error'),
                    Button('Login', id='login-btn', cls='btn-primary btn-large'),
                    cls='login-box'
                ),
                id='login-overlay',
                cls='login-overlay'
            ),
            # Dashboard (hidden until login)
            Div(
                Header(
                    Div(
                        H1('The Zitan'),
                        P('Admin Dashboard', cls='subtitle'),
                        cls='header-brand'
                    ),
                    Div(
                        Div(
                            Span('', id='status-dot', cls='status-dot'),
                            Span('Loading...', id='status-label'),
                            cls='header-status'
                        ),
                        Button('Logout', id='logout-btn', cls='btn-logout'),
                        cls='header-right'
                    ),
                    cls='app-header'
                ),
                # Tab navigation
                Nav(
                    Button('Orders', data_tab='orders', cls='tab-btn active'),
                    Button('Menu', data_tab='menu', cls='tab-btn'),
                    Button('Analytics', data_tab='analytics', cls='tab-btn'),
                    Button('Settings', data_tab='settings', cls='tab-btn'),
                    cls='tab-nav'
                ),
                Main(
                    # ===== ORDERS TAB =====
                    Div(
                        Div(
                            Button('All', data_filter='all', cls='filter-btn active'),
                            Button('New', data_filter='new', cls='filter-btn'),
                            Button('Preparing', data_filter='preparing', cls='filter-btn'),
                            Button('Ready', data_filter='ready', cls='filter-btn'),
                            Button('Delivered', data_filter='delivered', cls='filter-btn'),
                            cls='order-filters'
                        ),
                        Div(id='orders-list', cls='orders-list'),
                        Div(
                            P('No orders yet today.', cls='empty-text'),
                            id='orders-empty',
                            cls='empty-state hidden'
                        ),
                        id='tab-orders',
                        cls='tab-panel active'
                    ),
                    # ===== MENU TAB =====
                    Div(
                        Div(
                            H2('Menu Items'),
                            Button('+ Add Item', id='add-item-btn', cls='btn-primary btn-sm'),
                            cls='section-header'
                        ),
                        Div(id='menu-list', cls='menu-list'),
                        id='tab-menu',
                        cls='tab-panel'
                    ),
                    # ===== ANALYTICS TAB =====
                    Div(
                        H2("Today's Summary"),
                        Div(
                            Div(
                                Span('0', id='stat-total', cls='stat-value'),
                                Span('Total Orders', cls='stat-label'),
                                cls='stat-card'
                            ),
                            Div(
                                Span('0', id='stat-revenue', cls='stat-value revenue'),
                                Span('Revenue', cls='stat-label'),
                                cls='stat-card'
                            ),
                            Div(
                                Span('0', id='stat-active', cls='stat-value active-stat'),
                                Span('Active', cls='stat-label'),
                                cls='stat-card'
                            ),
                            Div(
                                Span('0', id='stat-delivered', cls='stat-value delivered'),
                                Span('Delivered', cls='stat-label'),
                                cls='stat-card'
                            ),
                            cls='stats-grid'
                        ),
                        H2('Orders by Status'),
                        Div(id='status-breakdown', cls='status-breakdown'),
                        H2('Revenue by Payment'),
                        Div(id='payment-breakdown', cls='payment-breakdown'),
                        id='tab-analytics',
                        cls='tab-panel'
                    ),
                    # ===== SETTINGS TAB =====
                    Div(
                        H2('Restaurant Controls'),
                        Div(
                            Div(
                                Div(
                                    Span('Accepting Orders'),
                                    P('Turn off to pause all new orders', cls='control-hint'),
                                    cls='control-label'
                                ),
                                Label(
                                    Input(type='checkbox', id='accepting-toggle'),
                                    Span(cls='toggle-slider'),
                                    cls='toggle-switch'
                                ),
                                cls='control-row'
                            ),
                            Div(
                                Div(
                                    Span('Prep Time'),
                                    P('Estimated time shown to customers', cls='control-hint'),
                                    cls='control-label'
                                ),
                                Div(
                                    Button('-', id='prep-decrease', cls='prep-btn'),
                                    Span('25 min', id='prep-time-display', cls='prep-value'),
                                    Button('+', id='prep-increase', cls='prep-btn'),
                                    cls='prep-control'
                                ),
                                cls='control-row'
                            ),
                            cls='controls-card'
                        ),
                        id='tab-settings',
                        cls='tab-panel'
                    ),
                    cls='main-content'
                ),
                id='dashboard',
                cls='dashboard hidden'
            ),
            # Add/Edit menu item modal
            Div(
                Div(cls='modal-overlay', id='item-modal-overlay'),
                Div(
                    Div(
                        H3('Add Menu Item', id='item-modal-title'),
                        Button('\u00d7', id='close-item-modal', cls='btn-close'),
                        cls='modal-header'
                    ),
                    Div(
                        Div(
                            Label('Name *'),
                            Input(type='text', id='item-name', placeholder='e.g., Chicken Adobo'),
                            cls='form-group'
                        ),
                        Div(
                            Label('Description'),
                            Textarea(id='item-description', rows='2',
                                     placeholder='Short description...'),
                            cls='form-group'
                        ),
                        Div(
                            Div(
                                Label('Price *'),
                                Input(type='number', id='item-price', placeholder='0.00',
                                      min='0', step='0.01'),
                                cls='form-group'
                            ),
                            Div(
                                Label('Category *'),
                                Select(
                                    Option('Mains', value='mains'),
                                    Option('Sides', value='sides'),
                                    Option('Drinks', value='drinks'),
                                    id='item-category'
                                ),
                                cls='form-group'
                            ),
                            cls='form-row'
                        ),
                        Div(
                            Label('Image (optional)'),
                            Div(
                                Img(id='image-preview', cls='image-preview hidden'),
                                Label(
                                    Span('Choose image', cls='upload-label-text'),
                                    Input(type='file', id='item-image-file',
                                          accept='image/jpeg,image/png,image/webp,image/gif'),
                                    cls='upload-btn'
                                ),
                                Button('Remove', id='remove-image-btn',
                                       type='button', cls='btn-text-sm hidden'),
                                cls='image-upload-area'
                            ),
                            Input(type='hidden', id='item-image'),
                            cls='form-group'
                        ),
                        cls='modal-body'
                    ),
                    Div(
                        Button('Delete', id='delete-item-btn', cls='btn-danger'),
                        Button('Save', id='save-item-btn', cls='btn-primary'),
                        cls='modal-footer'
                    ),
                    cls='modal-content'
                ),
                id='item-modal',
                cls='modal hidden'
            ),
            # Order detail/edit modal
            Div(
                Div(cls='modal-overlay', id='order-modal-overlay'),
                Div(
                    Div(
                        H3('Order #', Span('----', id='order-modal-number'), id='order-modal-heading'),
                        Button('\u00d7', id='close-order-modal', cls='btn-close'),
                        cls='modal-header'
                    ),
                    Div(
                        # Status badge
                        Div(
                            Span('new', id='order-modal-status', cls='status-badge new'),
                            cls='order-modal-status-row'
                        ),
                        # Order items
                        Div(
                            H4('Items'),
                            Div(id='order-modal-items', cls='order-modal-items'),
                            cls='order-modal-section'
                        ),
                        # Order info
                        Div(
                            H4('Details'),
                            Div(
                                Div(
                                    Span('Order Type'),
                                    Strong('--', id='order-modal-type'),
                                    cls='info-row'
                                ),
                                Div(
                                    Span('Unit'),
                                    Strong('--', id='order-modal-unit'),
                                    cls='info-row'
                                ),
                                Div(
                                    Span('Phone'),
                                    Strong('--', id='order-modal-phone'),
                                    cls='info-row'
                                ),
                                Div(
                                    Span('Payment'),
                                    Strong('--', id='order-modal-payment'),
                                    cls='info-row'
                                ),
                                Div(
                                    Span('GCash Ref'),
                                    Strong('--', id='order-modal-gcash'),
                                    cls='info-row',
                                    id='order-modal-gcash-row'
                                ),
                                Div(
                                    Span('Cutlery'),
                                    Strong('--', id='order-modal-cutlery'),
                                    cls='info-row'
                                ),
                                Div(
                                    Span('Notes'),
                                    Strong('--', id='order-modal-notes'),
                                    cls='info-row'
                                ),
                                Div(
                                    Span('Total'),
                                    Strong('--', id='order-modal-total'),
                                    cls='info-row total'
                                ),
                                Div(
                                    Span('Time'),
                                    Strong('--', id='order-modal-time'),
                                    cls='info-row'
                                ),
                                cls='order-info-card'
                            ),
                            cls='order-modal-section'
                        ),
                        cls='modal-body'
                    ),
                    Div(
                        Button('Advance Status', id='order-advance-btn', cls='btn-primary'),
                        cls='modal-footer'
                    ),
                    cls='modal-content'
                ),
                id='order-modal',
                cls='modal hidden'
            ),
            Script(src='/static/js/admin.js'),
        ),
        lang='en'
    )
