from fasthtml.common import *


def admin_page():
    return Html(
        Head(
            Meta(charset='UTF-8'),
            Meta(name='viewport', content='width=device-width, initial-scale=1.0'),
            Title('Admin - The Garden Bistro'),
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
                        H1('The Garden Bistro'),
                        P('Admin Dashboard', cls='subtitle'),
                        cls='header-brand'
                    ),
                    Div(
                        Span('', id='status-dot', cls='status-dot'),
                        Span('Loading...', id='status-label'),
                        cls='header-status'
                    ),
                    cls='app-header'
                ),
                Main(
                    # Controls section
                    Section(
                        H2('Restaurant Controls'),
                        Div(
                            # Accepting orders toggle
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
                            # Prep time control
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
                        cls='section'
                    ),
                    # Today's summary
                    Section(
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
                                Span('0', id='stat-active', cls='stat-value active'),
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
                        cls='section'
                    ),
                    # Menu management
                    Section(
                        Div(
                            H2('Menu Items'),
                            Button('+ Add Item', id='add-item-btn', cls='btn-primary btn-sm'),
                            cls='section-header'
                        ),
                        Div(id='menu-list', cls='menu-list'),
                        cls='section'
                    ),
                    cls='main-content'
                ),
                id='dashboard',
                cls='dashboard hidden'
            ),
            # Add/Edit item modal
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
            Script(src='/static/js/admin.js'),
        ),
        lang='en'
    )
