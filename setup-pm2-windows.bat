@echo off
echo ========================================
echo PM2 Setup for AI Scorecard (Windows)
echo ========================================

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js 18.x from https://nodejs.org/
    exit /b 1
)

:: Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PM2 is not installed. Installing PM2...
    call npm install -g pm2
    call npm install -g pm2-windows-startup
)

:: Setup PM2
echo Setting up PM2...
call pm2 start ecosystem.config.js

:: Save PM2 configuration
echo Saving PM2 configuration...
call pm2 save

:: Setup PM2 to start on system boot
echo Setting up PM2 to start on Windows boot...
call pm2-startup install

echo ========================================
echo PM2 setup completed!
echo ========================================
echo The application is now running with PM2.
echo You can access it at http://localhost:3000
echo.
echo Additional commands:
echo - View logs: pm2 logs aiscorecard
echo - Restart app: pm2 restart aiscorecard
echo - Stop app: pm2 stop aiscorecard
echo - View status: pm2 status
echo ========================================

pause 