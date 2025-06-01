#!/bin/bash

# Exit on error
set -e

echo "========================================"
echo "AI Scorecard Server Setup"
echo "========================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "Please do not run as root. Run as a regular user with sudo privileges."
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    if [ -f env.production.template ]; then
        cp env.production.template .env.local
        echo "Please edit .env.local with your actual values."
    else
        echo "Warning: env.production.template not found. Creating empty .env.local"
        touch .env.local
    fi
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install --production=false --frozen-lockfile=false

# Build the application
echo "Building the application..."
pnpm run build

# Setup PM2
echo "Setting up PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup | tail -n 1 > pm2-startup-command.txt
echo "To enable PM2 on system startup, run the command in pm2-startup-command.txt"

echo "========================================"
echo "Server setup completed!"
echo "========================================"
echo "The application is now running with PM2."
echo "You can access it at http://localhost:3000"
echo ""
echo "Additional commands:"
echo "- View logs: pm2 logs aiscorecard"
echo "- Restart app: pm2 restart aiscorecard"
echo "- Stop app: pm2 stop aiscorecard"
echo "- View status: pm2 status"
echo "========================================" 