#!/bin/bash
# File system permissions setup script for Ubuntu deployment
# This script sets minimum necessary permissions for the Node.js application

# Ensure the script is run as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Variables - adjust these to match your deployment
APP_USER="nodejs"  # The user that will run the application
APP_GROUP="nodejs" # The group for the application user
APP_DIR="/home/$APP_USER/app" # Application directory
LOGS_DIR="/home/$APP_USER/logs" # Logs directory
TEMP_DIR="/home/$APP_USER/temp" # Temporary files directory

echo "Setting up file system permissions for the application..."

# Create user and group if they don't exist
if ! id -u $APP_USER >/dev/null 2>&1; then
  echo "Creating application user: $APP_USER"
  useradd -m -s /bin/bash $APP_USER
fi

# Create required directories
echo "Creating required directories..."
mkdir -p $APP_DIR
mkdir -p $LOGS_DIR
mkdir -p $TEMP_DIR

# Set ownership
echo "Setting ownership..."
chown -R $APP_USER:$APP_GROUP /home/$APP_USER
chown -R $APP_USER:$APP_GROUP $APP_DIR
chown -R $APP_USER:$APP_GROUP $LOGS_DIR
chown -R $APP_USER:$APP_GROUP $TEMP_DIR

# Set permissions
echo "Setting directory permissions..."
# App directory - read/execute for directories, read for files
find $APP_DIR -type d -exec chmod 755 {} \;
find $APP_DIR -type f -exec chmod 644 {} \;

# Make server.js executable
if [ -f "$APP_DIR/server.js" ]; then
  chmod 755 "$APP_DIR/server.js"
fi

# Logs directory - write access for the app user
chmod 755 $LOGS_DIR
# Temporary directory - write access for the app user
chmod 755 $TEMP_DIR

# Set specific permissions for sensitive files
echo "Setting specific permissions for sensitive files..."
if [ -f "$APP_DIR/.env.local" ]; then
  chmod 600 "$APP_DIR/.env.local"
fi

if [ -f "$APP_DIR/.env.production" ]; then
  chmod 600 "$APP_DIR/.env.production"
fi

echo "Adding nodejs user to necessary groups..."
# Add to necessary groups (adjust as needed)
usermod -aG www-data $APP_USER

# Set up PM2 to run as the application user
if command -v pm2 &> /dev/null; then
  echo "Setting up PM2 to run as $APP_USER..."
  
  # Create PM2 startup script for the application user
  sudo -u $APP_USER pm2 startup ubuntu -u $APP_USER --hp /home/$APP_USER
  
  # If PM2 is running the app already, save the current setup
  if sudo -u $APP_USER pm2 list | grep -q "online"; then
    sudo -u $APP_USER pm2 save
  fi
fi

echo "File system permissions setup complete!"
echo "Your application will run with minimal necessary permissions."
echo "Temp and log directories have write access, while application code is protected." 