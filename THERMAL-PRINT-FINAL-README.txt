DESHAN TEXTILE POS PRO - FINAL 58MM DIRECT PRINT PATCH

This patch standardizes the main transaction printouts on the XP-58C direct ESC/POS bridge.

Covered:
- Sales Receipt / Sales History reprint
- Customer Payment Receipt
- Supplier Payment Receipt
- GRN / Purchase Receipt + purchase-history quick print
- Purchase Return Receipt
- Sales Return / Refund Receipt
- Shift Report

Printing behavior:
- Deshan logo on header
- business/branch/address/phone/terminal header
- 42-character 58mm layout
- word wrapping for long names/addresses/notes
- receipt length grows automatically with item count
- final feed + automatic cutter command
- browser print remains as fallback where already available

INSTALL
1. Stop the running print bridge (Ctrl+C).
2. Copy/merge the frontend and print-bridge folders in this patch into the project root.
3. From frontend run: npm run build
4. Return to project root and run: .\print-bridge\START-PRINT-BRIDGE.bat
5. Keep the bridge window open while using the POS.

TEST ORDER
1. Sales receipt (modal and Sales History black printer button)
2. Customer payment receipt
3. Supplier payment receipt
4. GRN receipt (modal and history quick print)
5. Purchase return receipt
6. Sales return receipt
7. Closed shift report

Note: The existing browser print functions are preserved as fallback if the local bridge is unavailable.
