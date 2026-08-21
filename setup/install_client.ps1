# ============================================================
# Deshan Textile POS Pro
# Client PC Production Setup
# ============================================================

$ErrorActionPreference = "Stop"

function Write-Step {
    param(
        [string]$Message
    )

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor DarkGray
}

function Write-Ok {
    param(
        [string]$Message
    )

    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param(
        [string]$Message
    )

    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param(
        [string]$Message
    )

    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# ============================================================
# 1. REQUIRE ADMINISTRATOR
# ============================================================

$identity =
    [Security.Principal.WindowsIdentity]::GetCurrent()

$principal =
    New-Object Security.Principal.WindowsPrincipal(
        $identity
    )

$isAdmin =
    $principal.IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )

if (-not $isAdmin) {

    Write-Host ""
    Write-Host "Administrator permission is required." -ForegroundColor Yellow
    Write-Host "Requesting elevation..." -ForegroundColor Yellow

    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            "`"$PSCommandPath`""
        ) `
        -Verb RunAs

    exit
}

# ============================================================
# 2. DETECT PROJECT ROOT
# ============================================================

Write-Step "Detecting Deshan Textile POS installation..."

$SetupDirectory =
    Split-Path `
        -Parent `
        $PSCommandPath

$ProjectRoot =
    Split-Path `
        -Parent `
        $SetupDirectory

$PrintBridgeDirectory =
    Join-Path `
        $ProjectRoot `
        "print-bridge"

$PrintBridgeBat =
    Join-Path `
        $PrintBridgeDirectory `
        "start_print_bridge.bat"

$PrintBridgePython =
    Join-Path `
        $PrintBridgeDirectory `
        "deshan_pos_print_bridge.py"

$BackupDirectory =
    Join-Path `
        $ProjectRoot `
        "backup"

$BackupScript =
    Join-Path `
        $BackupDirectory `
        "backup_database.ps1"

$RestoreScript =
    Join-Path `
        $BackupDirectory `
        "restore_database.ps1"

$BackupEnv =
    Join-Path `
        $BackupDirectory `
        "backup.env"

Write-Host "Project Root:"
Write-Host $ProjectRoot -ForegroundColor White

# ============================================================
# 3. VALIDATE REQUIRED FILES
# ============================================================

Write-Step "Checking required POS files..."

$RequiredFiles = @(
    $PrintBridgeBat,
    $PrintBridgePython,
    $BackupScript,
    $RestoreScript
)

$MissingFiles = @()

foreach ($File in $RequiredFiles) {

    if (-not (Test-Path $File)) {

        $MissingFiles += $File

        Write-Fail "Missing: $File"
    }
    else {

        Write-Ok "Found: $File"
    }
}

if ($MissingFiles.Count -gt 0) {

    Write-Host ""
    Write-Fail "Client setup cannot continue because required files are missing."

    Read-Host "Press Enter to close"
    exit 1
}

# ============================================================
# 4. CHECK PYTHON
# ============================================================

Write-Step "Checking Python..."

$PythonCommand =
    Get-Command `
        python `
        -ErrorAction SilentlyContinue

if (-not $PythonCommand) {

    Write-Fail "Python was not found in PATH."
    Write-Host ""
    Write-Host "Install Python before using the direct thermal print bridge."
    Write-Host "Then run this installer again."

    Read-Host "Press Enter to close"
    exit 1
}

Write-Ok "Python found: $($PythonCommand.Source)"

# ============================================================
# 5. CHECK POSTGRESQL TOOLS
# ============================================================

Write-Step "Checking PostgreSQL backup tools..."

$PgDumpCandidates = @(
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
)

$PgDump =
    $PgDumpCandidates |
    Where-Object {
        Test-Path $_
    } |
    Select-Object -First 1

if ($PgDump) {

    Write-Ok "pg_dump found: $PgDump"
}
else {

    Write-Warn "pg_dump was not found in the standard PostgreSQL paths."
    Write-Warn "Printing can still work, but automatic database backup may fail."
}

if (Test-Path $BackupEnv) {

    Write-Ok "Backup configuration found."
}
else {

    Write-Warn "backup\backup.env does not exist."
    Write-Warn "Weekly database backup will require this file before production use."
}

# ============================================================
# 6. WINDOWS USER
# ============================================================

Write-Step "Preparing Windows scheduled tasks..."

$CurrentUser =
    [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Ok "Windows user: $CurrentUser"

# ============================================================
# 7. REMOVE OLD TASKS
# ============================================================

$PrintTaskName =
    "Deshan POS Print Bridge"

$BackupTaskName =
    "Deshan POS Weekly Backup"

$OldPrintTask =
    Get-ScheduledTask `
        -TaskName $PrintTaskName `
        -ErrorAction SilentlyContinue

if ($OldPrintTask) {

    Unregister-ScheduledTask `
        -TaskName $PrintTaskName `
        -Confirm:$false

    Write-Ok "Previous Print Bridge task removed."
}

$OldBackupTask =
    Get-ScheduledTask `
        -TaskName $BackupTaskName `
        -ErrorAction SilentlyContinue

if ($OldBackupTask) {

    Unregister-ScheduledTask `
        -TaskName $BackupTaskName `
        -Confirm:$false

    Write-Ok "Previous Weekly Backup task removed."
}

# ============================================================
# 8. PRINT BRIDGE AUTO-START TASK
# ============================================================

Write-Step "Installing Print Bridge auto-start..."

$PrintAction =
    New-ScheduledTaskAction `
        -Execute "C:\Windows\System32\cmd.exe" `
        -Argument "/c `"`"$PrintBridgeBat`"`"" `
        -WorkingDirectory $PrintBridgeDirectory

$PrintTrigger =
    New-ScheduledTaskTrigger `
        -AtLogOn `
        -User $CurrentUser

$PrintSettings =
    New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew `
        -ExecutionTimeLimit ([TimeSpan]::Zero)

$PrintPrincipal =
    New-ScheduledTaskPrincipal `
        -UserId $CurrentUser `
        -LogonType Interactive `
        -RunLevel Highest

$PrintTask =
    New-ScheduledTask `
        -Action $PrintAction `
        -Trigger $PrintTrigger `
        -Settings $PrintSettings `
        -Principal $PrintPrincipal `
        -Description "Automatically starts the Deshan Textile POS local thermal print bridge when Windows user logs in."

Register-ScheduledTask `
    -TaskName $PrintTaskName `
    -InputObject $PrintTask `
    -Force |
    Out-Null

Write-Ok "Print Bridge scheduled task installed."

# ============================================================
# 9. WEEKLY BACKUP TASK
# ============================================================

Write-Step "Installing automatic weekly database backup..."

$BackupAction =
    New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$BackupScript`"" `
        -WorkingDirectory $ProjectRoot

$NextSunday =
    (Get-Date).Date

while ($NextSunday.DayOfWeek -ne "Sunday") {

    $NextSunday =
        $NextSunday.AddDays(1)
}

$BackupStartTime =
    $NextSunday.AddHours(22)

if ($BackupStartTime -le (Get-Date)) {

    $BackupStartTime =
        $BackupStartTime.AddDays(7)
}

$BackupTrigger =
    New-ScheduledTaskTrigger `
        -Weekly `
        -WeeksInterval 1 `
        -DaysOfWeek Sunday `
        -At $BackupStartTime

$BackupSettings =
    New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 10) `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1)

$BackupPrincipal =
    New-ScheduledTaskPrincipal `
        -UserId $CurrentUser `
        -LogonType Interactive `
        -RunLevel Highest

$BackupTask =
    New-ScheduledTask `
        -Action $BackupAction `
        -Trigger $BackupTrigger `
        -Settings $BackupSettings `
        -Principal $BackupPrincipal `
        -Description "Creates the automatic weekly Deshan Textile POS Supabase database backup every Sunday at 10 PM."

Register-ScheduledTask `
    -TaskName $BackupTaskName `
    -InputObject $BackupTask `
    -Force |
    Out-Null

Write-Ok "Weekly Backup scheduled task installed."
Write-Ok "Schedule: Every Sunday at 10:00 PM"

# ============================================================
# 10. START PRINT BRIDGE NOW
# ============================================================

Write-Step "Starting Print Bridge..."

try {

    Start-ScheduledTask `
        -TaskName $PrintTaskName

    Start-Sleep `
        -Seconds 3

    Write-Ok "Print Bridge startup requested."
}
catch {

    Write-Warn "Unable to start Print Bridge automatically."
    Write-Warn $_.Exception.Message
}

# ============================================================
# 11. VERIFY TASKS
# ============================================================

Write-Step "Verifying client scheduled tasks..."

$InstalledTasks =
    Get-ScheduledTask |
    Where-Object {
        $_.TaskName -in @(
            $PrintTaskName,
            $BackupTaskName
        )
    } |
    Select-Object `
        TaskName,
        State

$InstalledTasks |
    Format-Table `
        -AutoSize

# ============================================================
# 12. PRINT BRIDGE HEALTH CHECK
# ============================================================

Write-Step "Checking local print bridge..."

try {

    $TestConnection =
        Test-NetConnection `
            -ComputerName "127.0.0.1" `
            -Port 17858 `
            -WarningAction SilentlyContinue

    if ($TestConnection.TcpTestSucceeded) {

        Write-Ok "Print Bridge is listening on 127.0.0.1:17858"
    }
    else {

        Write-Warn "Print Bridge port 17858 is not responding yet."
        Write-Warn "Check Python, printer configuration, or the Task Scheduler task."
    }
}
catch {

    Write-Warn "Unable to test the print bridge connection."
}

# ============================================================
# 13. FINAL CLIENT CHECKLIST
# ============================================================

Write-Step "DESHAN TEXTILE POS CLIENT SETUP COMPLETE"

Write-Host ""
Write-Host "Installed:" -ForegroundColor Cyan

Write-Host "  [1] Print Bridge auto-start"
Write-Host "  [2] Weekly database backup"
Write-Host "  [3] Backup retry protection"
Write-Host "  [4] Missed backup recovery"
Write-Host "  [5] Client path auto-detection"

Write-Host ""
Write-Host "Manual checks still required:" -ForegroundColor Yellow

Write-Host "  [ ] XP-58C printer installed"
Write-Host "  [ ] Chrome Local network permission = Allow"
Write-Host "  [ ] Chrome Apps on device permission = Allow"
Write-Host "  [ ] Deshan Textile POS web app installed"
Write-Host "  [ ] Direct receipt print tested"
Write-Host "  [ ] backup\backup.env configured"
Write-Host "  [ ] Secondary cloud backup configured"
Write-Host "  [ ] Recovery readiness test passed"

Write-Host ""
Write-Host "Project:" -ForegroundColor DarkGray
Write-Host "  $ProjectRoot"

Write-Host ""
Write-Host "Client installation completed successfully." -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to close"