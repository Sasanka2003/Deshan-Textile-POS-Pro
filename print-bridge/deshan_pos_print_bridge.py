import base64
import ctypes
import json
import os
import sys
from ctypes import wintypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = '127.0.0.1'
PORT = 17858
PRINTER_NAME = 'XP-58C'
TEXT_WIDTH = 42
BODY_WIDTH = 48

CLIENT_HEADER_VALUE = 'deshan-textile-pos'

# Safe browser origins allowed to call the localhost print bridge.
# Add the deployed POS origin through the DESHAN_POS_ALLOWED_ORIGINS
# environment variable, comma-separated, e.g.
# https://pos.example.com,https://deshan-pos.example.lk
_DEFAULT_ALLOWED_ORIGINS = {
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://deshan-textile-pos-pro.pages.dev',
}

_EXTRA_ALLOWED_ORIGINS = {
    origin.strip().rstrip('/')
    for origin in os.environ.get(
        'DESHAN_POS_ALLOWED_ORIGINS',
        '',
    ).split(',')
    if origin.strip()
}

ALLOWED_ORIGINS = (
    _DEFAULT_ALLOWED_ORIGINS
    | _EXTRA_ALLOWED_ORIGINS
)

if sys.platform != 'win32':
    raise SystemExit('This print bridge must run on Windows.')

winspool = ctypes.WinDLL('winspool.drv')

class DOC_INFO_1(ctypes.Structure):
    _fields_ = [
        ('pDocName', wintypes.LPWSTR),
        ('pOutputFile', wintypes.LPWSTR),
        ('pDatatype', wintypes.LPWSTR),
    ]

OpenPrinter = winspool.OpenPrinterW
OpenPrinter.argtypes = [wintypes.LPWSTR, ctypes.POINTER(wintypes.HANDLE), wintypes.LPVOID]
OpenPrinter.restype = wintypes.BOOL

ClosePrinter = winspool.ClosePrinter
ClosePrinter.argtypes = [wintypes.HANDLE]
ClosePrinter.restype = wintypes.BOOL

StartDocPrinter = winspool.StartDocPrinterW
StartDocPrinter.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPVOID]
StartDocPrinter.restype = wintypes.DWORD

EndDocPrinter = winspool.EndDocPrinter
EndDocPrinter.argtypes = [wintypes.HANDLE]
EndDocPrinter.restype = wintypes.BOOL

StartPagePrinter = winspool.StartPagePrinter
StartPagePrinter.argtypes = [wintypes.HANDLE]
StartPagePrinter.restype = wintypes.BOOL

EndPagePrinter = winspool.EndPagePrinter
EndPagePrinter.argtypes = [wintypes.HANDLE]
EndPagePrinter.restype = wintypes.BOOL

WritePrinter = winspool.WritePrinter
WritePrinter.argtypes = [wintypes.HANDLE, wintypes.LPVOID, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
WritePrinter.restype = wintypes.BOOL

LOGO_RASTER = base64.b64decode('HXYwABMAZQAAAAAAP/////4AAAAAAAAAAAAAAAAAAAf/////wAAAAAAAAAAAAAAAAAAA//AA//gAAAAAAAAAAAAAAAAAAP/wAAf+AAAAAAAAAAAAAAAAAAB/8AAB/4AAAAAAAAAAAAAAAAAAf/AAAH/gAAAAAAAAAAAAAAAAAD/wAAA/8AAAAAAAAAAAAAAAAAA/8AAAH/gAAAAAAAAAAAAAAAAAP/AAAA/8AAAAAAAAAAAAAAAAAD/wAAAH/gAAAAAAAAAAAAAAAAA/8AAAB/8AAAAAAAAAAAAAAAAAP/AAAAP/gAAAAAAAAAAAAAAAAD/wAAAD/4AAAAAAAAAAAAAAAAA/8AAAAf/AAAAAAAAAAAAAAAAAP/AAAAH/wAAAAAAAAAAAAAAAAD/wAAAA/+AAAAAAAAAAAAAAAAA/8Af///////AAAAAAAAAAAAAAP/AH///////4AAAAAAAAAAAAAD/wB/8D/8B/+AAAAAAAAAAAAAA/8Af4A//AB/gAAAAAAAAAAAAAP/AH4AP/wAP4AAAAAAAAAAAAAD/wB8AD/8AA+AAAAAAAAAAAAAA/8AeAA//AAHgAAAAAAAAAAAAAP/AHAAP/wAA4AAAAAAAAAAAAAD/wBgAD/8AAOAAAAAAAAAAAAAA/8AAAA//AABgAAAAAAAAAAAAAP/AAAAP+D4AYAAAAAAAAAAAAAD/wAAAD8P/4AAAAAAAAAAAAAAA/8AAAA8f//AAAAAAAAAAAAAAAP/AAAAM/8B8AAAAAAAAAAAAAAD/wAAAA/wADgAAAAAAAAAAAAAA/8AAAA/hAAMAAAAAAAAAAAAAAP/AAAA/jwABAAAAAAAAAAAAAAD/wAAB/H8AAAAAAAAAAAAAAAAA/8AAB/H/AAAAAAAAAAAAAAAAAP/AAB/H/wAAAAAAAAAAAAAAAAD/wAB/n/8AAAAAAAAAAAAAAAAA/8AB/j//AAAAAAAAAAAAAAAAAP/AB/j//wAAAAAAAAAAAAAAAAD/wB/h//8AAAAAAAAAAAAAAAAA/8D/h8//AAAAAAAAAAAAAAAAGAAH/h8P/wAAAAAAAAAAAAAAAA+A//g8D/8AAAAAAAAAAAAAAAAD///A8A//AAAAAAAAAAAAAAAAAH/+A8AP/wAAAAAAAAAAAAAAAAAH4A4AH/8AAAAAAAAAAAAAAAAA4AAAAB//AAAAAAAAAAAAAAAAAP/AAAAf/wAAAAAAAAAAAAAAAAD/wAAAH/8AAAAAAAAAAAAAAAAA/8AAAD//AAAAAAAAAAAAAAAAAP/AAAA//wAAAAAAAAAAAAAAAAD/wAAAf/8AAAAAAAAAAAAAAAAA/8AAAP//AAAAAAAAAAAAAAAAAP/AAAH//wAAAAAAAAAAAAAAAAD/wAAD/f8AAAAAAAAAAAAAAAAB/8AAB/n/AAAAAAAAAAAAAAAAAf/AAB/h/wAAAAAAAAAAAAAAAAP/wAB/gf8AAAAAAAAAAAAAAAAH/8AH/gH/AAAAAAAAAAAAAAAB//////AB/wAAAAAAAAAAAAAAAf////wAA/+AAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAAAAAAAAAAAH///8AAAAAAAAAAAAAAAAAAAAB////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAB//wAf8Af8P+AAMAAfwB/D4fgAPw8AOHgD8B+AADAAB+AHA+A8AB4DAHgcAeAPgAB4AAPwAwPgHwAeAYBwCAHgD4AAeAAD+AMD4B8AHgAA8AwB4A+AAHwAA/gDA+APgB4AAPgIAeAPgAD8AAP8AwPgD4AeBAD+AAHgD4AAvgADfgMD4AfAHgwAf4AB4A+AAb4AAz8DA+AHwB8cAH/gAfAPgAEfAAMfgwPgB8Af/AA/8AH//4ADHwADD8MD4AfAHhwAD/gB8A+AAw+AAwfjA+AHwB4MAAP8AeAPgAf/gAMD8wPgD8AeAAAA/AHgD4AH/4ADA/MD4A+AHgAAAHwB4A+ABAfAAwH7A+APAB4AQMA8AeAPgAwHwAMA/wPgHwAeAMDAPAHgD4AIA+ADAH8D4D4AHgHA4DgB4A+AGAPgAwA/A+D4AD8HgHBwA/AfgDgD8AcAHw//4AB//4A/4Af8P+B+D/wPwA4AAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A8BMD4CAwB4AAAAAAAAAAAAACAIAOAIAgMAQAAAAAAAAAAAAAAgDwDACAIDAHgAAAAAAH/////gIAgA4AgCAwBgH/////wAAAAAACAIAaAIAgMAQAAAAAAAAAAAAAAgDwEwCAIDwHwAAAAAAA==')

def trim_logo_raster(data, padding_rows=0):
    """
    Crop empty white rows from the top and bottom of an ESC/POS
    GS v 0 raster image while keeping a small safe padding.
    """
    try:
        # GS v 0 header:
        # 1D 76 30 m xL xH yL yH
        if len(data) < 8 or data[0:3] != b'\x1d\x76\x30':
            return data

        width_bytes = data[4] + (data[5] << 8)
        height = data[6] + (data[7] << 8)

        if width_bytes <= 0 or height <= 0:
            return data

        bitmap = data[8:]
        expected = width_bytes * height

        if len(bitmap) < expected:
            return data

        rows = [
            bitmap[i * width_bytes:(i + 1) * width_bytes]
            for i in range(height)
        ]

        non_empty = [
            i for i, row in enumerate(rows)
            if any(byte != 0 for byte in row)
        ]

        if not non_empty:
            return data

        first = max(0, non_empty[0] - padding_rows)
        last = min(height - 1, non_empty[-1] + padding_rows)

        cropped_rows = rows[first:last + 1]
        new_height = len(cropped_rows)

        header = bytes([
            0x1D, 0x76, 0x30, data[3],
            width_bytes & 0xFF,
            (width_bytes >> 8) & 0xFF,
            new_height & 0xFF,
            (new_height >> 8) & 0xFF,
        ])

        return header + b''.join(cropped_rows)

    except Exception:
        return data

def clean(value):
    if value is None:
        return ''
    return str(value).replace('\r', ' ').replace('\n', ' ').strip()

def num(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0

def money(value):
    return f'Rs. {num(value):,.2f}'

def label(value):
    return clean(value).replace('_', ' ').title()

def format_date(value):
    raw = clean(value)
    if not raw:
        return ''
    try:
        from datetime import datetime, timezone, timedelta
        dt = datetime.fromisoformat(raw.replace('Z', '+00:00'))
        colombo = timezone(timedelta(hours=5, minutes=30))
        return dt.astimezone(colombo).strftime('%b %d, %Y, %I:%M %p')
    except Exception:
        return raw

def wrap_words(value, width=TEXT_WIDTH):
    text = clean(value)
    if not text:
        return []
    words = text.split()
    out=[]
    line=''
    for word in words:
        if len(word) > width:
            if line:
                out.append(line); line=''
            while len(word) > width:
                out.append(word[:width]); word=word[width:]
        candidate = word if not line else f'{line} {word}'
        if len(candidate) <= width:
            line = candidate
        else:
            if line: out.append(line)
            line = word
    if line: out.append(line)
    return out

def center_lines(value, width=TEXT_WIDTH):
    return [line.center(width) for line in wrap_words(value, width)]

def lr(left, right, width=TEXT_WIDTH):
    left, right = clean(left), clean(right)
    if not right:
        return wrap_words(left, width) or ['']
    room=max(1, width-len(right)-1)
    left_lines=wrap_words(left, room) or ['']
    out=[]
    for i,line in enumerate(left_lines):
        if i == len(left_lines)-1:
            spaces=max(1, width-len(line)-len(right))
            out.append(line + ' '*spaces + right)
        else:
            out.append(line)
    return out

def append_lr(lines, left, right):
    lines.extend(lr(left, right))

def text_bytes(lines):
    return ('\n'.join(lines) + '\n').encode('cp437', 'replace')

def header_bytes(settings=None, business=None, branch=None, terminal_fallback=''):
    settings = settings or {}
    business = business or {}
    branch = branch or {}

    business_name = (
        settings.get('businessName')
        or business.get('name')
        or 'Deshan Textile'
    )

    branch_name = (
        settings.get('branchName')
        or branch.get('name')
        or ''
    )

    address = (
        settings.get('businessAddress')
        or branch.get('address')
        or business.get('address')
        or ''
    )

    phone = (
        settings.get('branchPhone')
        or settings.get('businessPhone')
        or branch.get('phone')
        or business.get('phone')
        or ''
    )

    terminal = (
        settings.get('terminalName')
        or terminal_fallback
        or ''
    )

    show_address = settings.get('showBusinessAddress', True)
    show_phone = settings.get('showBusinessPhone', True)

    # Make slash-separated addresses easier to read.
    address = clean(address)
    if address:
        address = ' / '.join(
            part.strip()
            for part in address.split('/')
            if part.strip()
        )

    # Initialise XP-58C in a predictable receipt mode:
    # ESC @      = initialise
    # ESC M 0    = Font A
    # ESC ! 0    = normal character size/style
    # ESC a 1    = centre alignment
    raw = bytearray(
        b'\x1b\x40'
        b'\x1b\x4d\x00'
        b'\x1b\x21\x00'
        b'\x1b\x61\x01'
    )

    # Closely cropped logo.
    raw += trim_logo_raster(LOGO_RASTER)

    header = []

    if business_name:
        header += wrap_words(business_name, TEXT_WIDTH)

    if branch_name:
        header += wrap_words(branch_name, TEXT_WIDTH)

    if show_address and address:
        header += wrap_words(address, TEXT_WIDTH)

    if show_phone and phone:
        header += wrap_words(
            'Tel: ' + clean(phone),
            TEXT_WIDTH,
        )

    if terminal:
        header += wrap_words(
            clean(terminal),
            TEXT_WIDTH,
        )

    # Only one line between logo and business details.
    raw += b'\n'
    raw += text_bytes(header)

    # Return to normal Font A + left alignment for receipt body.
    raw += b'\x1b\x4d\x00\x1b\x21\x00\x1b\x61\x00'

    return bytes(raw), []

def footer_lines(settings=None, reference='', width=TEXT_WIDTH):
    settings = settings or {}

    footer = clean(
        settings.get('receiptFooter')
        or 'Thank You! Please Come Again'
    )

    # Fix common punctuation entered through Settings.
    footer = footer.replace(' !', '!')

    lines = ['']

    normalized = ' '.join(
        footer.lower().split()
    )

    if normalized in (
        'thank you! please come again',
        'thank you! please come again.',
    ):
        lines.append(
            'THANK YOU!'.center(width)
        )
        lines.append(
            'Please Come Again'.center(width)
        )
    else:
        for line in wrap_words(
            footer,
            width,
        ):
            lines.append(
                line.center(width)
            )

    if reference:
        for line in wrap_words(
            clean(reference),
            width,
        ):
            lines.append(
                line.center(width)
            )

    for line in wrap_words(
        'Powered by Deshan Textile POS',
        width,
    ):
        lines.append(
            line.center(width)
        )

    return lines

def finish(raw, lines):
    # Print content, then physically advance enough paper so the
    # footer clears the cutter before cutting.
    return (
        raw
        + text_bytes(lines)
        + b'\n\n\n'
        + b'\x1b\x64\x02'
        + b'\x1d\x56\x00'
    )


def build_sale(payload):
    BODY_WIDTH = globals()['BODY_WIDTH']

    inv = payload.get('invoice') or {}
    settings = payload.get('settings') or {}

    sale = inv.get('sale') or {}
    items = inv.get('items') or []
    payments = inv.get('payments') or []

    raw, _ = header_bytes(
        settings,
        inv.get('business'),
        inv.get('branch'),
    )

    # Compact Font B for the receipt body.
    raw += b'\x1b\x4d\x01\x1b\x21\x00\x1b\x61\x00'

    lines = []

    def add_center(value):
        text = clean(value)

        for line in wrap_words(text, BODY_WIDTH):
            lines.append(line.center(BODY_WIDTH))

    def add_lr(left, right):
        left = clean(left)
        right = clean(right)

        if not right:
            lines.extend(
                wrap_words(
                    left,
                    BODY_WIDTH,
                ) or ['']
            )
            return

        room = max(
            1,
            BODY_WIDTH - len(right) - 1,
        )

        left_lines = (
            wrap_words(left, room)
            or ['']
        )

        for index, line in enumerate(left_lines):
            if index == len(left_lines) - 1:
                spaces = max(
                    1,
                    BODY_WIDTH
                    - len(line)
                    - len(right),
                )

                lines.append(
                    line
                    + (' ' * spaces)
                    + right
                )
            else:
                lines.append(line)

    # Receipt title
    lines.append('-' * BODY_WIDTH)
    add_center('SALES RECEIPT')
    lines.append('-' * BODY_WIDTH)

    # Sale details
    add_lr(
        'Invoice',
        sale.get('invoiceNo', ''),
    )

    add_lr(
        'Date',
        format_date(
            sale.get('createdAt')
        ),
    )

    add_lr(
        'Cashier',
        sale.get('staffName')
        or '-',
    )

    add_lr(
        'Customer',
        sale.get('customerName')
        or 'Walk-in Customer',
    )

    add_lr(
        'Sale Type',
        label(
            sale.get('saleType')
        ),
    )

    # Items
    lines.append('-' * BODY_WIDTH)
    lines.append('ITEMS')

    for index, item in enumerate(items, 1):
        product_name = clean(
            item.get('productName')
            or 'Item'
        )

        name_lines = (
            wrap_words(
                product_name,
                BODY_WIDTH - 5,
            )
            or ['Item']
        )

        for name_index, name_line in enumerate(name_lines):
            if name_index == 0:
                add_lr(
                    name_line,
                    '#' + str(index),
                )
            else:
                lines.append(name_line)

        barcode = clean(
            item.get('barcode')
        )

        sku = clean(
            item.get('sku')
        )

        if barcode:
            lines.extend(
                wrap_words(
                    barcode,
                    BODY_WIDTH,
                )
            )

        elif sku:
            lines.extend(
                wrap_words(
                    sku,
                    BODY_WIDTH,
                )
            )

        add_lr(
            f"{num(item.get('quantity')):g} x "
            f"{money(item.get('unitPrice'))}",
            money(
                item.get('lineTotal')
            ),
        )

        item_discount = num(
            item.get('discountAmount')
        )

        if item_discount > 0:
            add_lr(
                '  Item Discount',
                '- ' + money(
                    item_discount
                ),
            )

    # Totals
    lines.append('-' * BODY_WIDTH)

    add_lr(
        'Subtotal',
        money(
            sale.get('subtotal')
        ),
    )

    order_discount = num(
        sale.get('discountAmount')
    )

    tax = num(
        sale.get('taxAmount')
    )

    if order_discount > 0:
        add_lr(
            'Order Discount',
            '- ' + money(
                order_discount
            ),
        )

    if tax > 0:
        add_lr(
            'Tax',
            money(tax),
        )

    lines.append('=' * BODY_WIDTH)

    add_lr(
        'TOTAL',
        money(
            sale.get('total')
        ),
    )

    add_lr(
        'Paid',
        money(
            sale.get('paidAmount')
        ),
    )

    add_lr(
        'Balance',
        money(
            sale.get('balanceDue')
        ),
    )

    # Payment breakdown
    lines.append('-' * BODY_WIDTH)
    lines.append('PAYMENT')

    if payments:
        for payment in payments:
            add_lr(
                label(
                    payment.get(
                        'paymentMethod'
                    )
                ) or 'Payment',
                money(
                    payment.get(
                        'amount'
                    )
                ),
            )
    else:
        add_lr(
            'Payment',
            money(
                sale.get(
                    'paidAmount'
                )
            ),
        )

    # Optional notes
    notes = clean(
        sale.get('notes')
    )

    if notes:
        lines.append('-' * BODY_WIDTH)
        lines.append('NOTES')

        lines.extend(
            wrap_words(
                notes,
                BODY_WIDTH,
            )
        )

    lines.append('-' * BODY_WIDTH)

    lines += footer_lines(
        settings,
        sale.get(
            'invoiceNo',
            '',
        ),
        BODY_WIDTH,
    )

    return finish(
        raw,
        lines,
    )

def start_compact_receipt(
    settings=None,
    business=None,
    branch=None,
    terminal_fallback='',
):
    """
    Start a professional 48-column XP-58C receipt body.
    Header/logo stays in the existing readable format.
    """
    width = BODY_WIDTH

    raw, _ = header_bytes(
        settings,
        business,
        branch,
        terminal_fallback,
    )

    # Font B + normal size + left alignment
    raw += b'\x1b\x4d\x01\x1b\x21\x00\x1b\x61\x00'

    return raw, [], width


def compact_center(lines, value, width=48):
    text = clean(value)

    for line in wrap_words(text, width):
        lines.append(line.center(width))


def compact_lr(lines, left, right, width=48):
    left = clean(left)
    right = clean(right)

    if not right:
        lines.extend(
            wrap_words(left, width) or ['']
        )
        return

    room = max(
        1,
        width - len(right) - 1,
    )

    left_lines = (
        wrap_words(left, room)
        or ['']
    )

    for index, line in enumerate(left_lines):
        if index == len(left_lines) - 1:
            spaces = max(
                1,
                width - len(line) - len(right),
            )

            lines.append(
                line
                + (' ' * spaces)
                + right
            )
        else:
            lines.append(line)


def compact_title(lines, title, width=48):
    lines.append('-' * width)
    compact_center(lines, title, width)
    lines.append('-' * width)


def compact_section(lines, title, width=48):
    lines.append('-' * width)
    lines.append(clean(title))


def compact_footer(lines, settings, reference, width=48):
    lines.append('-' * width)

    lines.extend(
        footer_lines(
            settings,
            reference,
            width,
        )
    )


def compact_item_name(lines, name, index, width=48):
    name_lines = (
        wrap_words(
            clean(name) or 'Item',
            width - 5,
        )
        or ['Item']
    )

    for line_index, line in enumerate(name_lines):
        if line_index == 0:
            compact_lr(
                lines,
                line,
                '#' + str(index),
                width,
            )
        else:
            lines.append(line)


def build_customer_payment(payload):
    r = payload.get('receipt') or {}
    settings = payload.get('settings') or {}

    raw, lines, width = start_compact_receipt(
        settings,
        r.get('business'),
        r.get('branch'),
    )

    compact_title(
        lines,
        'CUSTOMER PAYMENT RECEIPT',
        width,
    )

    compact_lr(lines, 'Receipt No', r.get('receiptNo', ''), width)
    compact_lr(lines, 'Date', format_date(r.get('createdAt')), width)

    cust = r.get('customer') or {}
    staff = r.get('staff') or {}

    compact_lr(lines, 'Customer', cust.get('name') or '-', width)
    compact_lr(lines, 'Phone', cust.get('phone') or '-', width)
    compact_lr(
        lines,
        'Received By',
        staff.get('fullName')
        or r.get('receivedBy')
        or '-',
        width,
    )
    compact_lr(
        lines,
        'Method',
        label(r.get('paymentMethod')) or '-',
        width,
    )

    if r.get('referenceNo'):
        compact_section(lines, 'REFERENCE', width)
        lines.extend(
            wrap_words(
                r.get('referenceNo'),
                width,
            )
        )

    compact_section(lines, 'BALANCE', width)

    compact_lr(
        lines,
        'Previous Balance',
        money(r.get('previousBalance')),
        width,
    )

    lines.append('=' * width)

    compact_lr(
        lines,
        'AMOUNT RECEIVED',
        money(r.get('amount')),
        width,
    )

    compact_lr(
        lines,
        'Remaining Balance',
        money(r.get('remainingBalance')),
        width,
    )

    if r.get('note'):
        compact_section(lines, 'NOTE', width)
        lines.extend(
            wrap_words(
                r.get('note'),
                width,
            )
        )

    compact_footer(
        lines,
        settings,
        r.get('receiptNo', ''),
        width,
    )

    return finish(raw, lines)


def build_supplier_payment(payload):
    r = payload.get('receipt') or {}
    settings = payload.get('settings') or {}

    raw, lines, width = start_compact_receipt(
        settings,
        r.get('business'),
        r.get('branch'),
    )

    compact_title(
        lines,
        'SUPPLIER PAYMENT RECEIPT',
        width,
    )

    compact_lr(lines, 'Receipt No', r.get('receiptNo', ''), width)
    compact_lr(lines, 'Date', format_date(r.get('paidAt')), width)

    sup = r.get('supplier') or {}
    staff = r.get('staff') or {}

    compact_lr(lines, 'Supplier', sup.get('name') or '-', width)
    compact_lr(lines, 'Phone', sup.get('phone') or '-', width)

    compact_lr(
        lines,
        'Paid By',
        staff.get('fullName')
        or r.get('paidBy')
        or '-',
        width,
    )

    compact_lr(
        lines,
        'Method',
        label(r.get('paymentMethod')) or '-',
        width,
    )

    if r.get('referenceNo'):
        compact_section(lines, 'REFERENCE', width)
        lines.extend(
            wrap_words(
                r.get('referenceNo'),
                width,
            )
        )

    compact_section(lines, 'BALANCE', width)

    compact_lr(
        lines,
        'Previous Payable',
        money(r.get('previousBalance')),
        width,
    )

    lines.append('=' * width)

    compact_lr(
        lines,
        'AMOUNT PAID',
        money(r.get('amount')),
        width,
    )

    compact_lr(
        lines,
        'Remaining Payable',
        money(r.get('remainingBalance')),
        width,
    )

    if r.get('note'):
        compact_section(lines, 'NOTE', width)
        lines.extend(
            wrap_words(
                r.get('note'),
                width,
            )
        )

    compact_footer(
        lines,
        settings,
        r.get('receiptNo', ''),
        width,
    )

    return finish(raw, lines)


def build_purchase(payload):
    p = payload.get('purchase') or {}
    settings = payload.get('settings') or {}

    raw, lines, width = start_compact_receipt(
        settings,
    )

    compact_title(
        lines,
        'GOODS RECEIVED NOTE',
        width,
    )

    compact_lr(lines, 'GRN No', p.get('grn_no', ''), width)
    compact_lr(lines, 'Date', format_date(p.get('received_at')), width)

    sup = p.get('supplier') or {}
    staff = p.get('staff') or {}

    compact_lr(lines, 'Supplier', sup.get('name') or '-', width)
    compact_lr(
        lines,
        'Supplier Invoice',
        p.get('supplier_invoice_no') or '-',
        width,
    )
    compact_lr(
        lines,
        'Received By',
        staff.get('full_name') or '-',
        width,
    )
    compact_lr(
        lines,
        'Status',
        label(p.get('payment_status')) or '-',
        width,
    )

    compact_section(lines, 'ITEMS', width)

    for index, item in enumerate(
        p.get('items') or [],
        1,
    ):
        compact_item_name(
            lines,
            item.get('product_name') or 'Item',
            index,
            width,
        )

        code = (
            item.get('barcode')
            or item.get('sku')
        )

        if code:
            lines.extend(
                wrap_words(code, width)
            )

        compact_lr(
            lines,
            f"{num(item.get('quantity')):g} x "
            f"{money(item.get('unit_cost'))}",
            money(item.get('line_total')),
            width,
        )

        discount = num(
            item.get('line_discount')
        )

        if discount > 0:
            compact_lr(
                lines,
                '  Discount',
                '- ' + money(discount),
                width,
            )

    lines.append('-' * width)

    compact_lr(
        lines,
        'Subtotal',
        money(p.get('subtotal')),
        width,
    )

    discount = num(
        p.get('discount_amount')
    )

    if discount > 0:
        compact_lr(
            lines,
            'Discount',
            '- ' + money(discount),
            width,
        )

    lines.append('=' * width)

    compact_lr(
        lines,
        'TOTAL',
        money(p.get('total')),
        width,
    )

    compact_lr(
        lines,
        'Paid',
        money(p.get('paid_amount')),
        width,
    )

    compact_lr(
        lines,
        'Supplier Credit',
        money(p.get('balance_due')),
        width,
    )

    if p.get('notes'):
        compact_section(lines, 'NOTES', width)
        lines.extend(
            wrap_words(
                p.get('notes'),
                width,
            )
        )

    compact_footer(
        lines,
        settings,
        p.get('grn_no', ''),
        width,
    )

    return finish(raw, lines)


def build_purchase_return(payload):
    r = payload.get('receipt') or {}
    settings = payload.get('settings') or {}

    business = {
        'name': r.get('businessName'),
    }

    branch = {
        'name': r.get('branchName'),
        'address': r.get('branchAddress'),
        'phone': r.get('branchPhone'),
    }

    raw, lines, width = start_compact_receipt(
        settings,
        business,
        branch,
    )

    compact_title(
        lines,
        'PURCHASE RETURN NOTE',
        width,
    )

    compact_lr(lines, 'PRN No', r.get('returnNo', ''), width)
    compact_lr(lines, 'Original GRN', r.get('grnNo', ''), width)
    compact_lr(lines, 'Date', format_date(r.get('createdAt')), width)

    compact_lr(
        lines,
        'Supplier',
        r.get('supplierName') or '-',
        width,
    )

    compact_lr(
        lines,
        'Supplier Invoice',
        r.get('supplierInvoiceNo') or '-',
        width,
    )

    compact_lr(
        lines,
        'Returned By',
        r.get('staffName') or '-',
        width,
    )

    compact_lr(
        lines,
        'Status',
        label(r.get('status')) or '-',
        width,
    )

    compact_section(
        lines,
        'RETURNED ITEMS',
        width,
    )

    for index, item in enumerate(
        r.get('items') or [],
        1,
    ):
        compact_item_name(
            lines,
            item.get('productName') or 'Item',
            index,
            width,
        )

        code = (
            item.get('barcode')
            or item.get('sku')
        )

        if code:
            lines.extend(
                wrap_words(code, width)
            )

        compact_lr(
            lines,
            f"{num(item.get('quantity')):g} x "
            f"{money(item.get('unitCost'))}",
            money(item.get('lineRefund')),
            width,
        )

    lines.append('=' * width)

    compact_lr(
        lines,
        'TOTAL SUPPLIER CREDIT',
        money(r.get('refundAmount')),
        width,
    )

    if r.get('reason'):
        compact_section(lines, 'REASON', width)
        lines.extend(
            wrap_words(
                r.get('reason'),
                width,
            )
        )

    compact_footer(
        lines,
        settings,
        r.get('returnNo', ''),
        width,
    )

    return finish(raw, lines)


def build_sale_return(payload):
    r = payload.get('receipt') or {}
    settings = payload.get('settings') or {}

    business = {
        'name': r.get('businessName'),
    }

    branch = {
        'name': r.get('branchName'),
        'address': r.get('branchAddress'),
        'phone': r.get('branchPhone'),
    }

    raw, lines, width = start_compact_receipt(
        settings,
        business,
        branch,
    )

    compact_title(
        lines,
        'SALES RETURN RECEIPT',
        width,
    )

    compact_lr(lines, 'Return No', r.get('returnNo', ''), width)
    compact_lr(lines, 'Invoice', r.get('invoiceNo', ''), width)
    compact_lr(lines, 'Date', format_date(r.get('createdAt')), width)

    compact_lr(
        lines,
        'Customer',
        r.get('customerName')
        or 'Walk-in Customer',
        width,
    )

    compact_lr(
        lines,
        'Returned By',
        r.get('staffName') or '-',
        width,
    )

    compact_lr(
        lines,
        'Refund Method',
        label(r.get('refundMethod')) or '-',
        width,
    )

    compact_lr(
        lines,
        'Status',
        label(r.get('status')) or '-',
        width,
    )

    compact_section(
        lines,
        'RETURNED ITEMS',
        width,
    )

    for index, item in enumerate(
        r.get('items') or [],
        1,
    ):
        compact_item_name(
            lines,
            item.get('productName') or 'Item',
            index,
            width,
        )

        compact_lr(
            lines,
            f"{num(item.get('quantity')):g} x "
            f"{money(item.get('unitPrice'))}",
            money(item.get('lineRefund')),
            width,
        )

        discount = num(
            item.get('discountAmount')
        )

        if discount > 0:
            compact_lr(
                lines,
                '  Discount',
                '- ' + money(discount),
                width,
            )

    lines.append('=' * width)

    compact_lr(
        lines,
        'REFUND TOTAL',
        money(r.get('refundAmount')),
        width,
    )

    if r.get('reason'):
        compact_section(lines, 'REASON', width)
        lines.extend(
            wrap_words(
                r.get('reason'),
                width,
            )
        )

    compact_footer(
        lines,
        settings,
        r.get('returnNo', ''),
        width,
    )

    return finish(raw, lines)


def build_shift(payload):
    s = payload.get('shift') or {}
    d = payload.get('detail') or {}
    settings = payload.get('settings') or {}

    raw, lines, width = start_compact_receipt(
        settings,
        terminal_fallback=(
            s.get('terminalName')
            or ''
        ),
    )

    compact_title(
        lines,
        'SHIFT REPORT',
        width,
    )

    compact_lr(
        lines,
        'Cashier',
        s.get('cashierName') or '-',
        width,
    )

    compact_lr(
        lines,
        'Status',
        label(s.get('status')) or '-',
        width,
    )

    compact_lr(
        lines,
        'Opened',
        format_date(s.get('openedAt')),
        width,
    )

    compact_lr(
        lines,
        'Closed',
        format_date(s.get('closedAt')) or '-',
        width,
    )

    compact_lr(
        lines,
        'Transactions',
        d.get('transactionCount'),
        width,
    )

    compact_lr(
        lines,
        'Total Sales',
        money(d.get('totalSales')),
        width,
    )

    compact_section(
        lines,
        'PAYMENTS',
        width,
    )

    payments = d.get('payments') or {}

    for key in (
        'cash',
        'card',
        'qr',
        'bankTransfer',
        'other',
    ):
        if num(payments.get(key)) != 0:
            compact_lr(
                lines,
                label(key),
                money(payments.get(key)),
                width,
            )

    compact_section(
        lines,
        'CASH RECONCILIATION',
        width,
    )

    compact_lr(
        lines,
        'Opening Cash',
        money(s.get('openingCash')),
        width,
    )

    compact_lr(
        lines,
        'Cash Sales',
        money(s.get('cashSales')),
        width,
    )

    compact_lr(
        lines,
        'Customer Payments',
        money(
            s.get('customerCashPayments')
        ),
        width,
    )

    compact_lr(
        lines,
        'Cash In',
        money(s.get('cashIn')),
        width,
    )

    compact_lr(
        lines,
        'Cash Out',
        money(s.get('cashOut')),
        width,
    )

    compact_lr(
        lines,
        'Expected Cash',
        money(s.get('expectedCash')),
        width,
    )

    compact_lr(
        lines,
        'Actual Cash',
        money(s.get('closingCash')),
        width,
    )

    compact_lr(
        lines,
        'Difference',
        money(s.get('cashDifference')),
        width,
    )

    if s.get('closingNote'):
        compact_section(
            lines,
            'CLOSING NOTE',
            width,
        )

        lines.extend(
            wrap_words(
                s.get('closingNote'),
                width,
            )
        )

    shift_ref = (
        'SHIFT '
        + clean(s.get('id'))[:8].upper()
    )

    compact_footer(
        lines,
        settings,
        shift_ref,
        width,
    )

    return finish(raw, lines)

BUILDERS={
    '/print/sale':build_sale,
    '/print/customer-payment':build_customer_payment,
    '/print/supplier-payment':build_supplier_payment,
    '/print/purchase':build_purchase,
    '/print/purchase-return':build_purchase_return,
    '/print/return':build_sale_return,
    '/print/shift':build_shift,
}

def raw_print(data, doc_name='Deshan Textile POS Receipt'):
    handle = wintypes.HANDLE()
    if not OpenPrinter(PRINTER_NAME, ctypes.byref(handle), None):
        raise OSError(f'Unable to open printer: {PRINTER_NAME}')

    try:
        info = DOC_INFO_1(doc_name, None, 'RAW')
        job = StartDocPrinter(handle, 1, ctypes.cast(ctypes.byref(info), wintypes.LPVOID))
        if not job:
            raise OSError('StartDocPrinter failed.')
        try:
            if not StartPagePrinter(handle):
                raise OSError('StartPagePrinter failed.')
            try:
                buffer = ctypes.create_string_buffer(data)
                written = wintypes.DWORD(0)
                if not WritePrinter(handle, buffer, len(data), ctypes.byref(written)):
                    raise OSError('WritePrinter failed.')
                if written.value != len(data):
                    raise OSError(f'Only {written.value} of {len(data)} bytes were written.')
            finally:
                EndPagePrinter(handle)
        finally:
            EndDocPrinter(handle)
    finally:
        ClosePrinter(handle)

class Handler(BaseHTTPRequestHandler):
    def _origin_allowed(self):
        origin = self.headers.get('Origin')

        # Non-browser/local requests may not include Origin.
        if not origin:
            return True

        return origin.rstrip('/') in ALLOWED_ORIGINS

    def _client_allowed(self):
        return (
            self.headers.get('X-Deshan-POS-Client')
            == CLIENT_HEADER_VALUE
        )

    def _cors(self):
        origin = self.headers.get('Origin')

        if origin and origin.rstrip('/') in ALLOWED_ORIGINS:
            self.send_header(
                'Access-Control-Allow-Origin',
                origin,
            )
            self.send_header('Vary', 'Origin')

        self.send_header(
            'Access-Control-Allow-Headers',
            'Content-Type, X-Deshan-POS-Client',
        )
        self.send_header(
            'Access-Control-Allow-Methods',
            'POST, OPTIONS',
        )

        # Chromium Private Network Access (PNA).
        # Required when the hosted HTTPS POS calls a localhost/loopback bridge.
        if (
            self.headers.get(
                'Access-Control-Request-Private-Network',
                '',
            ).lower() == 'true'
        ):
            self.send_header(
                'Access-Control-Allow-Private-Network',
                'true',
            )

    def _json_response(self, status, payload):
        body = json.dumps(payload).encode('utf-8')

        self.send_response(status)
        self._cors()
        self.send_header(
            'Content-Type',
            'application/json',
        )
        self.send_header(
            'Content-Length',
            str(len(body)),
        )
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if not self._origin_allowed():
            self.send_response(403)
            self.end_headers()
            return

        requested_headers = (
            self.headers.get(
                'Access-Control-Request-Headers',
                '',
            ).lower()
        )

        if 'x-deshan-pos-client' not in requested_headers:
            self.send_response(403)
            self.end_headers()
            return

        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if not self._origin_allowed():
            self._json_response(
                403,
                {
                    'ok': False,
                    'error': 'Origin not allowed.',
                },
            )
            return

        if not self._client_allowed():
            self._json_response(
                403,
                {
                    'ok': False,
                    'error': 'Invalid print client.',
                },
            )
            return

        builder = BUILDERS.get(self.path)

        if builder is None:
            self._json_response(
                404,
                {
                    'ok': False,
                    'error': 'Unknown print endpoint.',
                },
            )
            return

        try:
            length = int(
                self.headers.get('Content-Length')
                or 0
            )

            if length <= 0:
                raise ValueError('Empty print request.')

            if length > 2_000_000:
                raise ValueError('Print request is too large.')

            payload = json.loads(
                self.rfile.read(length).decode('utf-8')
            )

            raw_print(builder(payload))

            self._json_response(
                200,
                {'ok': True},
            )

        except Exception as exc:
            self._json_response(
                500,
                {
                    'ok': False,
                    'error': str(exc),
                },
            )

    def log_message(self, fmt, *args):
        print('[bridge]', fmt % args)

def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'Deshan Textile POS print bridge running on http://{HOST}:{PORT}')
    print(f'Printer: {PRINTER_NAME}')
    print('58mm direct-print engine: all transaction receipts + logo + dynamic length + auto-cut.')
    print('Keep this window open while using the POS. Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()








