@echo off
setlocal

cd /d "%~dp0"

where pythonw >nul 2>&1
if %errorlevel%==0 (
    start "" /min pythonw "%~dp0deshan_pos_print_bridge.py"
    exit /b 0
)

where python >nul 2>&1
if %errorlevel%==0 (
    start "" /min python "%~dp0deshan_pos_print_bridge.py"
    exit /b 0
)

exit /b 1