@echo off
setlocal
cd /d "%~dp0"

echo Updating the installed TheNextTrade worker in C:\GSN ...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Update-ControlledWorker.ps1" -InstallRoot "C:\GSN"
if not %errorlevel% equ 0 (
  echo.
  echo Worker update failed. Close the running worker and try again.
  pause
  exit /b 1
)

echo.
echo Worker updated. Double-click C:\GSN\worker\START_LOCAL_WORKER.bat to start it.
pause
