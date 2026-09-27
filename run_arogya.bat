@echo off
title ArogyaPulse AI - National Health Supply Chain Grid
cls
echo ====================================================================
echo   AROGYAPULSE AI: National Federated Health Intelligence Grid
echo   National Scale Health Resource & Supply Chain Management Platform
echo   Ministry of Health & Family Welfare (MoHFW) / National Health Mission
echo ====================================================================
echo.
echo [1/2] Launching National Health Grid Dashboard in your web browser...
start "" "http://localhost:5050"

echo [2/2] Booting Python REST API & Federated Learning Backend...
echo Server running at: http://localhost:5050
echo Press Ctrl+C in this terminal to shut down.
echo.

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" backend\app.py
) else if exist "..\.venv\Scripts\python.exe" (
    "..\.venv\Scripts\python.exe" backend\app.py
) else (
    python backend\app.py
)

pause
