@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Build-VpsTestBundle.ps1" -BackendBaseUrl "http://127.0.0.1:8765"
if errorlevel 1 exit /b %errorlevel%
echo Bundle ready at: %~dp0dist\GSN-VPS-Test-Bundle
exit /b 0
