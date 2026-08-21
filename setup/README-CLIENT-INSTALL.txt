============================================================
DESHAN TEXTILE POS PRO
CLIENT PC INSTALLATION GUIDE
============================================================

PURPOSE
-------
This guide is for installing Deshan Textile POS Pro on a
production client Windows PC.

Do not give database passwords, Supabase credentials,
backup.env, or other private credentials to unauthorized users.


============================================================
1. REQUIRED SOFTWARE
============================================================

Install/check:

[ ] Google Chrome
[ ] Python
[ ] PostgreSQL client tools
[ ] XP-58C thermal printer driver

After installation verify:

python --version
pg_dump --version


============================================================
2. COPY THE PRODUCTION FILES
============================================================

Copy the Deshan Textile POS production package to a permanent
location on the client PC.

IMPORTANT:
Do not install the production package inside Downloads,
temporary folders, or a removable USB drive.

Do not move the folder after running the client installer,
because Windows Scheduled Tasks will use its installed path.


============================================================
3. CONFIGURE THE THERMAL PRINTER
============================================================

Install the XP-58C printer and confirm that Windows can print
a test page.

Check:

[ ] XP-58C appears in Windows Printers
[ ] Correct paper width is configured
[ ] Windows test print works
[ ] Thermal paper is installed correctly


============================================================
4. CONFIGURE DATABASE BACKUP
============================================================

Create/configure:

backup\backup.env

The file contains private database connection information.

IMPORTANT:
Never commit backup.env to GitHub.

The project .gitignore must continue to ignore:

backup/backup.env
backup/archives/
backup/logs/


============================================================
5. RUN CLIENT INSTALLER
============================================================

Open PowerShell in the project root.

Run:

powershell -ExecutionPolicy Bypass -File ".\setup\install_client.ps1"

Approve the Windows Administrator/UAC prompt.

The installer configures:

- Deshan POS Print Bridge
- Print Bridge auto-start at Windows login
- Deshan POS Weekly Backup
- Weekly backup every Sunday at 10:00 PM
- Backup retry protection
- Required file checks
- Python validation
- PostgreSQL tools validation
- Print Bridge health check


============================================================
6. VERIFY WINDOWS SCHEDULED TASKS
============================================================

Run:

Get-ScheduledTask |
Where-Object { $_.TaskName -like "*Deshan*" } |
Select-Object TaskName, State

Expected tasks:

Deshan POS Print Bridge
Deshan POS Weekly Backup


============================================================
7. OPEN THE HOSTED POS
============================================================

Open the official production Deshan Textile POS URL in
Google Chrome.

Log in using an authorized staff account.


============================================================
8. CHROME LOCAL DEVICE PERMISSIONS
============================================================

The hosted POS communicates with the local thermal print
bridge at:

127.0.0.1:17858

In Chrome Site Settings allow the permissions required for
local-device/loopback communication.

Check:

[ ] Local network = Allow
[ ] Apps on device = Allow

Reload the POS after changing permissions.


============================================================
9. INSTALL POS AS WINDOWS APP
============================================================

In Chrome:

Menu
-> Cast, save and share
-> Install page as app

Install:

Deshan Textile POS

Confirm that the Desktop/Start Menu app opens in standalone
application mode.


============================================================
10. DIRECT PRINT TEST
============================================================

Open Deshan Textile POS.

Perform or reprint a test sale receipt.

Expected result:

Hosted POS
    ->
127.0.0.1:17858
    ->
Deshan POS Print Bridge
    ->
XP-58C
    ->
Receipt

The receipt must print directly without the normal browser
print dialog.


============================================================
11. PRINT BRIDGE AUTO-START TEST
============================================================

Restart the client PC.

Do NOT manually start the print bridge.

Open Deshan Textile POS and print a receipt.

If direct printing works after restart, auto-start is working.


============================================================
12. DATABASE BACKUP TEST
============================================================

Run:

Start-ScheduledTask -TaskName "Deshan POS Weekly Backup"

After the task completes:

Get-ScheduledTaskInfo -TaskName "Deshan POS Weekly Backup" |
Select-Object LastRunTime, LastTaskResult, NextRunTime

Expected:

LastTaskResult = 0


Then, from the project root:

Get-ChildItem ".\backup\archives" |
Sort-Object LastWriteTime -Descending |
Select-Object -First 5 Name, Length, LastWriteTime

Confirm that a new:

.dump
.json

backup pair has been created.


============================================================
13. BACKUP RECOVERY READINESS TEST
============================================================

Run:

powershell -ExecutionPolicy Bypass -File ".\backup\restore_database.ps1"

The validation should report:

PostgreSQL archive structure is readable.
SHA256 integrity check passed.
Backup validation completed successfully.
Recovery readiness check PASSED.

IMPORTANT:
Do not perform a real restore against the production database
unless recovery is actually required and a safe recovery plan
has been confirmed.


============================================================
14. FINAL PRODUCTION TEST
============================================================

Before handover test:

[ ] Manager login
[ ] Cashier login
[ ] Open/close shift
[ ] Sale
[ ] Discount
[ ] Direct sale receipt
[ ] Sales history
[ ] Inventory deduction
[ ] Sale return
[ ] Stock restoration
[ ] Purchase
[ ] Purchase return
[ ] Supplier balance
[ ] Customer payment
[ ] Supplier payment
[ ] Payment receipts
[ ] Reports
[ ] Role permissions
[ ] Logout/session isolation
[ ] Offline sale
[ ] Reconnect/sync
[ ] Duplicate-sync protection
[ ] Desktop POS app
[ ] PC restart
[ ] Print Bridge auto-start
[ ] Scheduled database backup
[ ] Recovery readiness validation


============================================================
15. PRODUCTION SECURITY RULES
============================================================

NEVER publish or share:

- backup.env
- database passwords
- service-role keys
- private credentials
- generated database backups

Never disable browser security globally just to make local
printing work.

Only authorized administrators should have access to
production database credentials and backup files.


============================================================
16. NORMAL CLIENT OPERATION
============================================================

For normal daily use, the client should only need to:

1. Turn on the PC.
2. Turn on the XP-58C printer.
3. Open Deshan Textile POS from the Desktop.
4. Login.
5. Open the shift.
6. Use the POS.

The client should NOT need to:

- Open VS Code
- Run Python manually
- Start the Print Bridge manually
- Run PowerShell commands for daily sales
- Access Supabase
- Access GitHub


============================================================
DESHAN TEXTILE POS PRO
PRODUCTION CLIENT INSTALLATION GUIDE
============================================================