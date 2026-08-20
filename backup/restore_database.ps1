param(
    [ValidateSet("Validate", "Restore")]
    [string]$Mode = "Validate",

    [string]$BackupFile = "",

    [string]$ConfigFile = "$PSScriptRoot\backup.env",

    [string]$ConfirmRestore = ""
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------
# Deshan Textile POS Pro - Backup Validation / Restore
# ---------------------------------------------------------

$BackupRoot = Join-Path $PSScriptRoot "archives"
$LogRoot    = Join-Path $PSScriptRoot "logs"

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    if (-not (Test-Path $LogRoot)) {
        New-Item `
            -ItemType Directory `
            -Path $LogRoot `
            -Force |
            Out-Null
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"

    Write-Host $line

    $logFile = Join-Path `
        $LogRoot `
        ("restore-" + (Get-Date -Format "yyyy-MM") + ".log")

    Add-Content `
        -Path $logFile `
        -Value $line
}

function Load-EnvFile {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "Configuration file not found: $Path"
    }

    Get-Content $Path | ForEach-Object {

        $line = $_.Trim()

        if (
            [string]::IsNullOrWhiteSpace($line) -or
            $line.StartsWith("#")
        ) {
            return
        }

        $parts = $line.Split("=", 2)

        if ($parts.Count -ne 2) {
            return
        }

        $key = $parts[0].Trim()
        $value = $parts[1].Trim()

        Set-Item `
            -Path "Env:$key" `
            -Value $value
    }
}

function Find-PgRestore {

    $command = Get-Command `
        "pg_restore.exe" `
        -ErrorAction SilentlyContinue

    if ($command) {
        return $command.Source
    }

    $commonPaths = @(
        "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe",
        "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_restore.exe",
        "C:\Program Files\PostgreSQL\14\bin\pg_restore.exe"
    )

    foreach ($path in $commonPaths) {

        if (Test-Path $path) {
            return $path
        }
    }

    return $null
}

function Find-LatestBackup {

    if (-not (Test-Path $BackupRoot)) {
        throw "Backup archive directory does not exist: $BackupRoot"
    }

    $latest =
        Get-ChildItem `
            -Path $BackupRoot `
            -Filter "*.dump" `
            -File |
        Sort-Object `
            LastWriteTime `
            -Descending |
        Select-Object `
            -First 1

    if (-not $latest) {
        throw "No .dump backup files were found."
    }

    return $latest.FullName
}

function Validate-Backup {
    param(
        [string]$Path,
        [string]$PgRestorePath
    )

    Write-Log "Validating backup archive..."
    Write-Log "Backup: $Path"

    if (-not (Test-Path $Path)) {
        throw "Backup file does not exist: $Path"
    }

    $backupInfo = Get-Item $Path

    if ($backupInfo.Length -le 0) {
        throw "Backup archive is empty."
    }

    # ---------------------------------------------------------
    # PostgreSQL archive validation
    # ---------------------------------------------------------

    $listOutput =
        & $PgRestorePath `
            "--list" `
            $Path 2>&1

    if ($LASTEXITCODE -ne 0) {

        $details =
            $listOutput |
            Out-String

        throw "pg_restore could not read backup archive.`n$details"
    }

    if (
        -not $listOutput -or
        $listOutput.Count -eq 0
    ) {
        throw "Backup archive contains no readable restore entries."
    }

    Write-Log "PostgreSQL archive structure is readable."

    # ---------------------------------------------------------
    # SHA256 validation using manifest
    # ---------------------------------------------------------

    $manifestPath =
        [System.IO.Path]::ChangeExtension(
            $Path,
            ".json"
        )

    if (Test-Path $manifestPath) {

        Write-Log "Manifest found. Checking SHA256 integrity..."

        $manifest =
            Get-Content `
                $manifestPath `
                -Raw |
            ConvertFrom-Json

        $currentHash =
            Get-FileHash `
                -Path $Path `
                -Algorithm SHA256

        if (
            $manifest.sha256 -ne
            $currentHash.Hash
        ) {
            throw @"
BACKUP INTEGRITY CHECK FAILED.

Expected:
$($manifest.sha256)

Current:
$($currentHash.Hash)

The backup may be corrupted or modified.
"@
        }

        Write-Log "SHA256 integrity check passed."
    }
    else {

        Write-Log `
            "Manifest file not found. SHA256 comparison skipped." `
            "WARN"
    }

    $sizeMb =
        [Math]::Round(
            $backupInfo.Length / 1MB,
            2
        )

    Write-Log "Backup size: $sizeMb MB"
    Write-Log "Backup validation completed successfully."
}

function Restore-Backup {
    param(
        [string]$Path,
        [string]$PgRestorePath
    )

    if (
        $ConfirmRestore -ne
        "RESTORE_DESHAN_POS"
    ) {
        throw @"
RESTORE BLOCKED FOR SAFETY.

A database restore can overwrite live POS data.

To perform an intentional restore, run:

-Mode Restore -ConfirmRestore RESTORE_DESHAN_POS
"@
    }

    Load-EnvFile -Path $ConfigFile

    $requiredVariables = @(
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD"
    )

    foreach ($variable in $requiredVariables) {

        $value =
            [Environment]::GetEnvironmentVariable(
                $variable
            )

        if (
            [string]::IsNullOrWhiteSpace(
                $value
            )
        ) {
            throw "Missing database configuration: $variable"
        }
    }

    Write-Log `
        "WARNING: DATABASE RESTORE MODE ENABLED." `
        "WARN"

    Write-Log `
        "Target host: $($env:DB_HOST)" `
        "WARN"

    Write-Log `
        "Target database: $($env:DB_NAME)" `
        "WARN"

    # Validate before restoring
    Validate-Backup `
        -Path $Path `
        -PgRestorePath $PgRestorePath

    $env:PGPASSWORD =
        $env:DB_PASSWORD

    $env:PGSSLMODE =
        "require"

    Write-Log "Starting database restore..."

    $arguments = @(
        "--host=$($env:DB_HOST)",
        "--port=$($env:DB_PORT)",
        "--username=$($env:DB_USER)",
        "--dbname=$($env:DB_NAME)",
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists",
        "--exit-on-error",
        $Path
    )

    & $PgRestorePath @arguments

    $restoreExitCode =
        $LASTEXITCODE

    if ($restoreExitCode -ne 0) {
        throw "pg_restore failed with exit code $restoreExitCode"
    }

    Write-Log "Database restore completed successfully."
}

try {

    Write-Log "Deshan Textile POS recovery utility started."

    $pgRestorePath =
        Find-PgRestore

    if (
        [string]::IsNullOrWhiteSpace(
            $pgRestorePath
        )
    ) {
        throw "PostgreSQL pg_restore.exe was not found."
    }

    Write-Log "Using pg_restore: $pgRestorePath"

    if (
        [string]::IsNullOrWhiteSpace(
            $BackupFile
        )
    ) {

        $BackupFile =
            Find-LatestBackup

        Write-Log "Automatically selected latest backup."
    }

    $BackupFile =
        (Resolve-Path $BackupFile).Path

    if ($Mode -eq "Validate") {

        Validate-Backup `
            -Path $BackupFile `
            -PgRestorePath $pgRestorePath

        Write-Log "Recovery readiness check PASSED."
    }
    elseif ($Mode -eq "Restore") {

        Restore-Backup `
            -Path $BackupFile `
            -PgRestorePath $pgRestorePath
    }

    exit 0
}
catch {

    Write-Log `
        $_.Exception.Message `
        "ERROR"

    Write-Log `
        "RECOVERY OPERATION FAILED." `
        "ERROR"

    exit 1
}
finally {

    Remove-Item `
        Env:PGPASSWORD `
        -ErrorAction SilentlyContinue

    Remove-Item `
        Env:PGSSLMODE `
        -ErrorAction SilentlyContinue
}