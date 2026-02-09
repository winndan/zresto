from fasthtml.common import *


def staff_page():
    return Html(
        Head(
            Meta(charset='UTF-8'),
            Meta(name='viewport', content='width=device-width, initial-scale=1.0'),
            Title('Kitchen Dashboard - The Garden Bistro'),
            Link(rel='stylesheet', href='/static/css/staff.css'),
        ),
        Body(
            Header(
                Div(
                    H1('Kitchen Dashboard'),
                    P('The Garden Bistro', cls='subtitle'),
                    cls='header-brand'
                ),
                Div(
                    Span('0', id='active-count', cls='badge'),
                    Span(' active orders'),
                    cls='header-stats'
                ),
                cls='app-header'
            ),
            Main(
                Div(
                    # New orders column
                    Section(
                        Div(
                            Span('New', cls='col-label'),
                            Span('0', id='count-new', cls='col-count'),
                            cls='col-header new'
                        ),
                        Div(id='orders-new', cls='order-list'),
                        cls='order-column'
                    ),
                    # Preparing column
                    Section(
                        Div(
                            Span('Preparing', cls='col-label'),
                            Span('0', id='count-preparing', cls='col-count'),
                            cls='col-header preparing'
                        ),
                        Div(id='orders-preparing', cls='order-list'),
                        cls='order-column'
                    ),
                    # Ready column
                    Section(
                        Div(
                            Span('Ready', cls='col-label'),
                            Span('0', id='count-ready', cls='col-count'),
                            cls='col-header ready'
                        ),
                        Div(id='orders-ready', cls='order-list'),
                        cls='order-column'
                    ),
                    cls='order-board'
                ),
                cls='main-content'
            ),
            Script(src='/static/js/staff.js'),
        ),
        lang='en'
    )
