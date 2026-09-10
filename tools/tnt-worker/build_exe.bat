@echo off
echo ====================================================
echo  TheNextTrade - Headless MT5 Worker Build Script
echo ====================================================
echo.
echo Checking PyInstaller...
if exist ".venv\Scripts\pyinstaller.exe" (
    echo Using Python 3.11 virtual environment: .venv
    set "PYI=.venv\Scripts\pyinstaller.exe"
) else (
    pyinstaller --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] PyInstaller not found. Installing requirements...
        pip install -r requirements.txt pyinstaller
    )
    set "PYI=pyinstaller"
)

echo.
echo Compiling TNT-Cloud-Sync-Worker.exe...
%PYI% --onefile --clean --hidden-import=numpy --hidden-import=psutil --collect-all MetaTrader5 --add-data "servers_pack;servers_pack" --name "TNT-Cloud-Sync-Worker" worker.py

echo.
if exist "dist\TNT-Cloud-Sync-Worker.exe" (
    echo ====================================================
    echo [SUCCESS] Executable built successfully!
    echo Location: dist\TNT-Cloud-Sync-Worker.exe
    echo.
    echo To deploy on a laptop:
    echo 1. Copy dist\TNT-Cloud-Sync-Worker.exe and .env to your laptop.
    echo 2. Double click TNT-Cloud-Sync-Worker.exe to run.
    echo ====================================================
) else (
    echo [ERROR] Build failed! Check the log output above.
)
echo.
pause
