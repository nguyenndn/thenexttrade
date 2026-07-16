@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 start_local_worker.py %*
) else (
  python start_local_worker.py %*
)

if not %errorlevel% equ 0 pause
