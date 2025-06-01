#!/bin/bash

# Exit on error
set -e

echo "Starting server installation..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Check for Firebase configuration
if [ -f .env.local ]; then
    echo "Checking Firebase configuration in .env.local..."
    
    # Check for required Firebase environment variables
    if ! grep -q "NEXT_PUBLIC_FIREBASE_PROJECT_ID" .env.local; then
        echo "WARNING: Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local"
        echo "PDF generation will not work without proper Firebase configuration"
    fi
    
    # Check for either service account key or client email + private key
    if grep -q "FIREBASE_SERVICE_ACCOUNT_KEY" .env.local; then
        echo "Firebase Admin SDK configuration found: FIREBASE_SERVICE_ACCOUNT_KEY"
    elif grep -q "FIREBASE_CLIENT_EMAIL" .env.local && grep -q "FIREBASE_PRIVATE_KEY" .env.local; then
        echo "Firebase Admin SDK configuration found: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY"
    else
        echo "WARNING: Missing Firebase Admin SDK configuration in .env.local"
        echo "PDF generation will not work without either:"
        echo "1. FIREBASE_SERVICE_ACCOUNT_KEY (Base64 encoded service account JSON)"
        echo "OR"
        echo "2. Both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY"
    fi
else
    echo "WARNING: .env.local file not found"
    echo "Creating .env.local from template..."
    if [ -f env.production.template ]; then
        cp env.production.template .env.local
        echo "Please update .env.local with your actual Firebase credentials"
        echo "PDF generation will not work without proper Firebase configuration"
    else
        echo "ERROR: env.production.template not found"
        echo "Please create a .env.local file with required environment variables"
    fi
fi

# Install dependencies with production flag
echo "Installing dependencies..."
pnpm install --production=false --frozen-lockfile=false

# Build the application
echo "Building the application..."
pnpm run build

echo "Installation completed successfully!"
echo "You can now run 'pnpm start' to start the production server."
echo ""
echo "IMPORTANT: If you plan to use PDF generation, make sure your .env.local file"
echo "contains valid Firebase Admin SDK credentials (either FIREBASE_SERVICE_ACCOUNT_KEY"
echo "or both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY)." 