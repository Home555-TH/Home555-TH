@echo off
echo ================================================
echo   CNC ePR AI Cloud System - Windows Setup
echo ================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please download and install Node.js from: https://nodejs.org
    echo Then run this script again.
    pause
    exit /b 1
)
echo [OK] Node.js found:
node --version

:: Install dependencies
echo.
echo [1/3] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed.

:: Create data folder
if not exist "data" mkdir data
echo [OK] Data folder ready.

:: Create .env if not exists
if not exist ".env" (
    echo.
    echo [2/3] Creating .env file...
    copy .env.example .env >nul
    echo [OK] .env created from template.
    echo.
    echo !! IMPORTANT: Open .env and fill in your API keys !!
) else (
    echo [2/3] .env already exists - skipping.
)

:: Start server
echo.
echo [3/3] Starting server...
echo.
echo ================================================
echo   Server starting at: http://localhost:3000
echo   Press Ctrl+C to stop
echo ================================================
echo.
npm run dev
