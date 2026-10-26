# MuleNet AI - Bit Brains Launcher (PowerShell)
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  MULENET AI (Cyber Hackathon 2026 - PS-01)" -ForegroundColor Yellow
Write-Host "  Starting Backend and Frontend Services..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\backend'; python -m uvicorn app.main:app --port 8000"

# 2. Start Frontend
Write-Host "[2/2] Launching Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$scriptDir\frontend`" && npm run dev"

# 3. Open Browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  MuleNet AI is now running!" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
