@echo off
title MuleNet AI - Bit Brains Launcher
echo ===================================================
echo   MULENET AI (Cyber Hackathon 2026 - PS-01)
echo   Starting Backend and Frontend Services...
echo ===================================================

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "MuleNet Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000"

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
start "MuleNet Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo ===================================================
echo   MuleNet AI is now running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
