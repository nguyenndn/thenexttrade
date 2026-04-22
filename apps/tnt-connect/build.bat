@echo off
echo ============================================
echo   TNT Connect - Build Script
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Install Python 3.10+ first.
    pause
    exit /b 1
)

REM Create venv if not exists
if not exist "venv" (
    echo [1/4] Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies
echo [2/4] Installing dependencies...
pip install -r requirements.txt --quiet
pip install pyinstaller --quiet

REM Build
echo [3/4] Building TNTConnect.exe...
pyinstaller build.spec --clean --noconfirm

echo.
echo [4/4] Build complete!
echo.
echo Output: dist\TNTConnect.exe
echo Size:
for %%A in (dist\TNTConnect.exe) do echo   %%~zA bytes (%%~zA)
echo.
echo ============================================
pause
