#!/usr/bin/env bash
# BuildIQ — start both servers and open the browser
# macOS: double-click this file in Finder (or chmod +x && ./start.sh in Terminal)
# Linux: chmod +x start.sh && ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo " =========================================="
echo "   BuildIQ - Starting Application"
echo " =========================================="
echo ""

# ── Check prerequisites ────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "[ERROR] Python not found. Please install Python 3.9+ from https://python.org"
    exit 1
fi
PYTHON=$(command -v python3 || command -v python)

if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# ── Backend setup ──────────────────────────────────────────────────────────────
echo "[1/4] Setting up backend..."
cd "$SCRIPT_DIR/backend"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "      Created backend/.env from .env.example"
    echo "      NOTE: Edit backend/.env to add your GEMINI_API_KEY and other secrets."
fi

if [ ! -d "venv" ]; then
    echo "      Creating Python virtual environment..."
    $PYTHON -m venv venv
fi

source venv/bin/activate
echo "      Installing/updating Python dependencies..."
pip install -r requirements.txt -q

echo "      Starting Flask backend on http://localhost:5000 ..."
python app.py &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# ── Frontend setup ─────────────────────────────────────────────────────────────
echo ""
echo "[2/4] Setting up frontend..."
cd "$SCRIPT_DIR/frontend"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "      Installing Node dependencies (first run only, may take a minute)..."
    npm install
fi

echo "      Starting Vite dev server on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# ── Open browser ───────────────────────────────────────────────────────────────
echo ""
echo "[3/4] Waiting for servers to start..."
sleep 4

echo "[4/4] Opening browser at http://localhost:5173 ..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:5173"
else
    xdg-open "http://localhost:5173" 2>/dev/null || sensible-browser "http://localhost:5173" 2>/dev/null || true
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo " =========================================="
echo "   BuildIQ is running!"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:5000"
echo " =========================================="
echo ""
echo " Press Ctrl+C to stop all servers."
echo ""

# Wait and clean up on exit
trap "echo ''; echo 'Stopping servers...'; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; echo 'Done.'" EXIT INT TERM
wait $FRONTEND_PID $BACKEND_PID
