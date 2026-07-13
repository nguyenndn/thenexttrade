@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "CONFIG_PATH=%~1"
if "%CONFIG_PATH%"=="" set "CONFIG_PATH=%SCRIPT_DIR%bootstrap.config.json"

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Requesting Administrator privileges...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "Start-Process -FilePath '%~f0' -ArgumentList '""%CONFIG_PATH%""' -Verb RunAs"
  exit /b
)

if not exist "%CONFIG_PATH%" (
  echo ERROR: Config file not found: %CONFIG_PATH%
  echo Copy bootstrap.config.example.json to bootstrap.config.json and edit it first.
  pause
  exit /b 2
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass ^
  -File "%SCRIPT_DIR%Install-GSNWorker.ps1" -ConfigPath "%CONFIG_PATH%"
set "EXIT_CODE=%errorlevel%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo GSN bootstrap failed with exit code %EXIT_CODE%.
  echo Review C:\GSN\logs\bootstrap-*.log for details.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo GSN Windows Worker bootstrap completed.
echo Run Verify-GSNWorker.ps1 for a fresh readiness report.
pause
exit /b 0
