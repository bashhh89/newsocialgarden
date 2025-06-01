@echo off
echo ========================================
echo AI Scorecard Production Setup (Windows)
echo ========================================

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js 18.x from https://nodejs.org/
    exit /b 1
)

:: Check Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

:: Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo pnpm is not installed. Installing pnpm...
    call npm install -g pnpm
)

:: Create logs directory
echo Creating logs directory...
if not exist logs mkdir logs

:: Check if port 3006 is in use and kill it
echo Checking if port 3006 is in use...
netstat -ano | findstr :3006 >nul
if %ERRORLEVEL% EQU 0 (
    echo Port 3006 is in use. Killing processes...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3006') do (
        echo Killing process with PID: %%p
        taskkill /F /PID %%p
    )
)

:: Run verification script
echo Running deployment verification...
node verify-deploy-readiness.js
if %ERRORLEVEL% NEQ 0 (
    echo Verification failed. Please fix the issues before continuing.
    exit /b 1
)

:: Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PM2 is not installed. Installing PM2...
    call npm install -g pm2
    call npm install -g pm2-windows-startup
    
    :: Initialize PM2 Windows startup
    echo Initializing PM2 Windows startup...
    call pm2-startup install
)

:: Stop any existing instance
echo Stopping any existing PM2 processes...
call pm2 stop aiscorecard >nul 2>nul
call pm2 delete aiscorecard >nul 2>nul

:: Setup PM2
echo Setting up PM2 for production...
call pm2 start ecosystem.config.js

:: Save PM2 configuration
echo Saving PM2 configuration...
call pm2 save

echo ========================================
echo Production setup completed!
echo ========================================
echo The application is now running with PM2.
echo You can access it at http://localhost:3006
echo.
echo Additional commands:
echo - View logs: pm2 logs aiscorecard
echo - Restart app: pm2 restart aiscorecard
echo - Stop app: pm2 stop aiscorecard
echo - View status: pm2 status
echo - Monitor: pm2 monit
echo ========================================

echo.
echo Press any key to exit...
pause > nul 