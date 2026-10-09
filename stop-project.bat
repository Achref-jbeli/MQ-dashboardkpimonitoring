@echo off
title Stop KPI Dashboard
color 0C

echo =============================================
echo   Marquardt KPI Dashboard - Stopping...
echo =============================================
echo.

echo Stopping Backend (dotnet)...
taskkill /F /IM dotnet.exe >nul 2>&1
echo Stopping Frontend (node)...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo =============================================
echo   All servers stopped.
echo =============================================
echo.
pause
