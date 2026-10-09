@echo off
title Marquardt KPI Dashboard - Launcher
color 0A

echo =============================================
echo   Marquardt KPI Dashboard - Starting...
echo =============================================
echo.

:: Start Backend in a new window
echo [1/2] Starting Backend (ASP.NET Core - port 5189)...
start "BACKEND - KPI Dashboard" cmd /k "cd /d "%~dp0backend\DashboardKpi.Api" && dotnet run --urls http://localhost:5189"

:: Wait 3 seconds before starting frontend
timeout /t 3 /nobreak >nul

:: Start Frontend in a new window
echo [2/2] Starting Frontend (Vite - port 5173)...
start "FRONTEND - KPI Dashboard" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =============================================
echo   Both servers are starting:
echo   - Backend:  http://localhost:5189
echo   - Frontend: http://localhost:5173
echo =============================================
echo.
echo   Frontend will be ready in ~10 seconds.
echo   Press any key to open the app in browser...
pause >nul

start http://localhost:5173
