@echo off
setlocal
chcp 65001 >nul
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"

if not exist "%~dp0.venv\Scripts\python.exe" (
  echo Virtual environment Python not found: "%~dp0.venv\Scripts\python.exe"
  pause
  exit /b 1
)

set "VIRTUAL_ENV=%~dp0.venv"
set "PYTHON_HOME="
for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"home = " "%VIRTUAL_ENV%\pyvenv.cfg"') do set "PYTHON_HOME=%%B"
if defined PYTHON_HOME set "PYTHON_HOME=%PYTHON_HOME:~1%"

if defined PYTHON_HOME (
  set "PATH=%VIRTUAL_ENV%\Scripts;%PYTHON_HOME%;%PYTHON_HOME%\DLLs;%PYTHON_HOME%\Library\bin;%PATH%"
) else (
  set "PATH=%VIRTUAL_ENV%\Scripts;%PATH%"
)

start "TG Backend" cmd /k "cd /d ""%~dp0back"" && start.bat"
start "TG Frontend" cmd /k "cd /d ""%~dp0front"" && npm run dev"

endlocal
