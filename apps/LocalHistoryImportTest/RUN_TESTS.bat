@echo off
setlocal
set "ROOT=%~dp0"
set "VENV=%ROOT%.test-venv"

if not exist "%VENV%\Scripts\python.exe" (
  py -3.12 -m venv "%VENV%" 2>nul
  if errorlevel 1 python -m venv "%VENV%"
)
if not exist "%VENV%\Scripts\python.exe" (
  echo ERROR: Python is required to run tests.
  exit /b 2
)

"%VENV%\Scripts\python.exe" -m pip install --disable-pip-version-check -r "%ROOT%tests\requirements.txt"
if errorlevel 1 exit /b 3
"%VENV%\Scripts\python.exe" -m pytest "%ROOT%tests" -q
exit /b %errorlevel%
