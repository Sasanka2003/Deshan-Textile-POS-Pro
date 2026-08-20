param(
    [string]$ConfigFile = "$PSScriptRoot\backup.env"
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------
# Deshan Textile POS Pro - Supabase PostgreSQL Backup
# ---------------------------------------------------------

$BackupRoot = Join-Path $PSScriptRoot "archives"
$LogRoot = Join-Path $PSScriptRoot "logs"

$RetentionDays = 60

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"

    Write-Host $line

    if (-not (Test-Path $LogRoot)) {
        New-Item `
            -ItemType Directory `
            -Path $LogRoot `
            -Force |
            Out-Null
    }

    $logFile = Join-Path `
        $LogRoot `
        ("backup-" + (Get-Date -Format "yyyy-MM") + ".log")

    Add-Content `
        -Path $logFile `
        -Value $line
}

function Load-EnvFile {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "Backup configuration file not found: $Path"
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

function Find-PgDump {

    $command = Get-Command `
        "pg_dump.exe" `
        -ErrorAction SilentlyContinue

    if ($command) {
        return $command.Source
    }

    $commonPaths = @(
        "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
    )

    foreach ($path in $commonPaths) {

        if (Test-Path $path) {
            return $path
        }
    }

    return $null
}

try {

    Write-Log "Starting Deshan Textile POS database backup."

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
            throw "Missing required configuration: $variable"
        }
    }

    # ---------------------------------------------------------
    # Find PostgreSQL pg_dump.exe
    # ---------------------------------------------------------

    $pgDumpPath = Find-PgDump

    if (
        [string]::IsNullOrWhiteSpace(
            $pgDumpPath
        )
    ) {
        throw @"
PostgreSQL pg_dump.exe was not found.

Expected location example:
C:\Program Files\PostgreSQL\17\bin\pg_dump.exe

Install PostgreSQL command-line tools and try again.
"@
    }

    Write-Log "Using pg_dump: $pgDumpPath"

    # ---------------------------------------------------------
    # Prepare backup folder
    # ---------------------------------------------------------

    if (-not (Test-Path $BackupRoot)) {

        New-Item `
            -ItemType Directory `
            -Path $BackupRoot `
            -Force |
            Out-Null
    }

    $timestamp =
        Get-Date `
            -Format "yyyy-MM-dd_HH-mm-ss"

    $backupFile =
        Join-Path `
            $BackupRoot `
            "deshan-pos-public-$timestamp.dump"

    $manifestFile =
        Join-Path `
            $BackupRoot `
            "deshan-pos-public-$timestamp.json"

    # ---------------------------------------------------------
    # PostgreSQL environment
    # ---------------------------------------------------------

    $env:PGPASSWORD =
        $env:DB_PASSWORD

    $env:PGSSLMODE =
        "require"

    Write-Log "Creating database backup..."
    Write-Log "Destination: $backupFile"

    # ---------------------------------------------------------
    # pg_dump arguments
    # ---------------------------------------------------------

    $arguments = @(
        "--host=$($env:DB_HOST)",
        "--port=$($env:DB_PORT)",
        "--username=$($env:DB_USER)",
        "--dbname=$($env:DB_NAME)",
        "--format=custom",
        "--compress=9",
        "--schema=public",
        "--no-owner",
        "--no-privileges",
        "--file=$backupFile"
    )

    # ---------------------------------------------------------
    # Run pg_dump
    # ---------------------------------------------------------

    & $pgDumpPath @arguments

    $dumpExitCode =
        $LASTEXITCODE

    if ($dumpExitCode -ne 0) {

        throw "pg_dump failed with exit code $dumpExitCode"
    }

    # ---------------------------------------------------------
    # Validate backup file
    # ---------------------------------------------------------

    if (-not (Test-Path $backupFile)) {

        throw "Backup file was not created."
    }

    $backupInfo =
        Get-Item $backupFile

    if ($backupInfo.Length -le 0) {

        throw "Backup file is empty."
    }

    # ---------------------------------------------------------
    # Integrity hash
    # ---------------------------------------------------------

    $hash =
        Get-FileHash `
            -Path $backupFile `
            -Algorithm SHA256

    # ---------------------------------------------------------
    # Backup manifest
    # ---------------------------------------------------------

    $manifest = [ordered]@{

        application =
            "Deshan Textile POS Pro"

        backup_type =
            "Supabase PostgreSQL public schema"

        created_at =
            (Get-Date).ToString("o")

        database_host =
            $env:DB_HOST

        database_name =
            $env:DB_NAME

        schema =
            "public"

        file =
            $backupInfo.Name

        size_bytes =
            $backupInfo.Length

        sha256 =
            $hash.Hash

        retention_days =
            $RetentionDays

        computer =
            $env:COMPUTERNAME
    }

    $manifest |
        ConvertTo-Json -Depth 5 |
        Set-Content `
            -Path $manifestFile `
            -Encoding UTF8

    Write-Log "Backup completed successfully."

    Write-Log (
        "Backup size: " +
        [Math]::Round(
            $backupInfo.Length / 1MB,
            2
        ) +
        " MB"
    )

    Write-Log "SHA256: $($hash.Hash)"

    # ---------------------------------------------------------
    # Optional secondary/off-site copy
    # ---------------------------------------------------------

    if (
        -not [string]::IsNullOrWhiteSpace(
            $env:SECONDARY_BACKUP_PATH
        )
    ) {

        $secondaryPath =
            $env:SECONDARY_BACKUP_PATH

        if (
            -not (Test-Path $secondaryPath)
        ) {

            New-Item `
                -ItemType Directory `
                -Path $secondaryPath `
                -Force |
                Out-Null
        }

        Copy-Item `
            -Path $backupFile `
            -Destination $secondaryPath `
            -Force

        Copy-Item `
            -Path $manifestFile `
            -Destination $secondaryPath `
            -Force

        Write-Log (
            "Secondary backup copy completed: " +
            $secondaryPath
        )
    }

    # ---------------------------------------------------------
    # Local retention cleanup
    # ---------------------------------------------------------

    $cutoff =
        (Get-Date).AddDays(
            -$RetentionDays
        )

    $oldFiles =
        Get-ChildItem `
            -Path $BackupRoot `
            -File |
        Where-Object {
            $_.LastWriteTime -lt $cutoff
        }

    foreach ($oldFile in $oldFiles) {

        Write-Log (
            "Removing expired backup: " +
            $oldFile.Name
        )

        Remove-Item `
            -Path $oldFile.FullName `
            -Force
    }

    # ---------------------------------------------------------
    # Secondary retention cleanup
    # ---------------------------------------------------------

    if (
        -not [string]::IsNullOrWhiteSpace(
            $env:SECONDARY_BACKUP_PATH
        ) -and
        (Test-Path $env:SECONDARY_BACKUP_PATH)
    ) {

        $oldSecondaryFiles =
            Get-ChildItem `
                -Path $env:SECONDARY_BACKUP_PATH `
                -File |
            Where-Object {
                $_.LastWriteTime -lt $cutoff
            }

        foreach (
            $oldFile in $oldSecondaryFiles
        ) {

            Remove-Item `
                -Path $oldFile.FullName `
                -Force
        }
    }

    Write-Log "Backup retention cleanup completed."
    Write-Log "Backup process finished successfully."

    exit 0
}
catch {

    Write-Log `
        $_.Exception.Message `
        "ERROR"

    Write-Log `
        "DATABASE BACKUP FAILED." `
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