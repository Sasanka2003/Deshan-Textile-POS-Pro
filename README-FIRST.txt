DESHAN TEXTILE POS - XP-58C FINAL SALES RECEIPT PATCH

1) Stop the existing print bridge (Ctrl+C).
2) Copy the "frontend" and "print-bridge" folders from this patch into the Deshan-Textile-POS-Pro root folder.
3) Choose Merge/Replace when Windows asks.
4) In frontend run: npm run build
5) Start: print-bridge\START-PRINT-BRIDGE.bat
6) Keep the bridge window open while using the POS.
7) Print from the receipt modal OR the Sales History black printer button.

Included final behaviour:
- Direct XP-58C printing (no Chrome preview when bridge is available)
- Browser print fallback if bridge is unavailable
- Deshan logo printed as ESC/POS raster graphic
- 58mm full-width / 42-column layout
- Real invoice, date, cashier, customer, sale type
- Unlimited/dynamic item count (receipt length grows automatically)
- Item/order discounts, tax, totals, payment breakdown, notes
- Business/branch/address/phone/terminal/settings footer
- Automatic paper feed and full cut

Printer queue name expected by the bridge: XP-58C
