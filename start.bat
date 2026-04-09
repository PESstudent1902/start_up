@echo off
title BuildIQ Launcher
color 0A

echo.
echo  ==========================================
echo    BuildIQ - Starting Application
echo  ==========================================
echo.

:: ── Check prerequisites ──────────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

:: ── Backend setup ────────────────────────────────────────────────────────────
echo [1/4] Setting up backend...
cd /d "%~dp0backend"

if not exist ".env" (
    echo       Creating .env from .env.example...
    copy .env.example .env >nul
    echo       [NOTE] Edit backend\.env to add your GEMINI_API_KEY and other secrets.
)

if not exist "venv" (
    echo       Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo       Installing/updating Python dependencies...
pip install -r requirements.txt -q

echo       Starting Flask backend on http://localhost:5000 ...
start "BuildIQ Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python app.py"

:: ── Frontend setup ───────────────────────────────────────────────────────────
echo.
echo [2/4] Setting up frontend...
cd /d "%~dp0frontend"

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    )
)

if not exist "node_modules" (
    echo       Installing Node dependencies (first run only, may take a minute)...
    npm install
)

echo       Starting Vite dev server on http://localhost:5173 ...
start "BuildIQ Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: ── Open browser ─────────────────────────────────────────────────────────────
echo.
echo [3/4] Waiting for servers to start...
timeout /t 4 /nobreak >nul

echo [4/4] Opening browser at http://localhost:5173 ...
start "" http://localhost:5173

:: ── Done ─────────────────────────────────────────────────────────────────────
echo.
echo  ==========================================
echo    BuildIQ is running!
echo    Frontend : http://localhost:5173
echo    Backend  : http://localhost:5000
echo  ==========================================
echo.
echo  Two terminal windows have opened for the servers.
echo  Close BOTH windows to stop the application.
echo.
pause
