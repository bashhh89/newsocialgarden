@echo off
echo ========================================
echo AI Scorecard Server Setup (Windows)
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

:: Check if .env.local exists
if not exist .env.local (
    echo WARNING: .env.local file not found
    echo Creating .env.local from template...
    if exist env.production.template (
        copy env.production.template .env.local
        echo Please edit .env.local with your actual Firebase credentials
        echo PDF generation will not work without proper Firebase configuration
    ) else (
        echo ERROR: env.production.template not found
        echo Please create a .env.local file with required environment variables
        echo PDF generation will not work without proper Firebase configuration
    )
) else (
    echo Checking Firebase configuration in .env.local...
    
    :: Check for required Firebase Project ID
    findstr "NEXT_PUBLIC_FIREBASE_PROJECT_ID" .env.local >nul
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local
        echo PDF generation will not work without proper Firebase configuration
    )
    
    :: Check for either service account key or client email + private key
    findstr "FIREBASE_SERVICE_ACCOUNT_KEY" .env.local >nul
    if %ERRORLEVEL% EQU 0 (
        echo Firebase Admin SDK configuration found: FIREBASE_SERVICE_ACCOUNT_KEY
    ) else (
        findstr "FIREBASE_CLIENT_EMAIL" .env.local >nul
        set HAS_CLIENT_EMAIL=%ERRORLEVEL%
        findstr "FIREBASE_PRIVATE_KEY" .env.local >nul
        set HAS_PRIVATE_KEY=%ERRORLEVEL%
        
        if %HAS_CLIENT_EMAIL% EQU 0 if %HAS_PRIVATE_KEY% EQU 0 (
            echo Firebase Admin SDK configuration found: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
        ) else (
            echo WARNING: Missing Firebase Admin SDK configuration in .env.local
            echo PDF generation will not work without either:
            echo 1. FIREBASE_SERVICE_ACCOUNT_KEY (Base64 encoded service account JSON)
            echo OR
            echo 2. Both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
        )
    )
)

:: Install dependencies
echo Installing dependencies...
call pnpm install --production=false --frozen-lockfile=false

:: Build the application
echo Building the application...
call pnpm run build

echo ========================================
echo Server setup completed!
echo ========================================
echo You can now run the application with:
echo pnpm start
echo ========================================
echo.
echo IMPORTANT: If you plan to use PDF generation, make sure your .env.local file
echo contains valid Firebase Admin SDK credentials (either FIREBASE_SERVICE_ACCOUNT_KEY
echo or both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY).

pause 