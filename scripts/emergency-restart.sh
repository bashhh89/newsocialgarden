#!/bin/bash
# Emergency Restart Script for Ubuntu
# Safely kills any processes using the application port and restarts the application

# Ensure the script is run as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Configuration
APP_PORT=3006
APP_USER="nodejs"
APP_DIR="/home/$APP_USER/app"
LOG_FILE="/var/log/emergency-restart.log"

# Timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "[$TIMESTAMP] Emergency restart initiated" | tee -a $LOG_FILE

# Function to check if a process is running
is_process_running() {
  pgrep -f "$1" >/dev/null
  return $?
}

# 1. Check if PM2 is running
if command -v pm2 &> /dev/null; then
  echo "[$TIMESTAMP] PM2 is installed" | tee -a $LOG_FILE
  
  if is_process_running "PM2"; then
    echo "[$TIMESTAMP] PM2 process manager is running" | tee -a $LOG_FILE
  else
    echo "[$TIMESTAMP] PM2 process manager is not running, attempting to start it" | tee -a $LOG_FILE
    if [ -f "/etc/systemd/system/pm2-$APP_USER.service" ]; then
      systemctl start pm2-$APP_USER
    else
      sudo -u $APP_USER pm2 resurrect
    fi
  fi
else
  echo "[$TIMESTAMP] PM2 is not installed, installing now" | tee -a $LOG_FILE
  npm install -g pm2
fi

# 2. Kill processes using the application port
echo "[$TIMESTAMP] Checking for processes using port $APP_PORT" | tee -a $LOG_FILE
PORT_PIDS=$(lsof -ti:$APP_PORT)

if [ -n "$PORT_PIDS" ]; then
  echo "[$TIMESTAMP] Found processes using port $APP_PORT, killing: $PORT_PIDS" | tee -a $LOG_FILE
  kill -9 $PORT_PIDS
  sleep 2
else
  echo "[$TIMESTAMP] No processes found using port $APP_PORT" | tee -a $LOG_FILE
fi

# 3. Save current system status for diagnosis
echo "[$TIMESTAMP] Saving system status for diagnosis" | tee -a $LOG_FILE

# Memory usage
free -m > /tmp/memory-status.txt
echo "Memory status saved to /tmp/memory-status.txt" | tee -a $LOG_FILE

# Disk usage
df -h > /tmp/disk-status.txt
echo "Disk status saved to /tmp/disk-status.txt" | tee -a $LOG_FILE

# Process list
ps aux > /tmp/process-status.txt
echo "Process status saved to /tmp/process-status.txt" | tee -a $LOG_FILE

# Network connections
netstat -tuln > /tmp/network-status.txt
echo "Network status saved to /tmp/network-status.txt" | tee -a $LOG_FILE

# 4. Restart the application using PM2
echo "[$TIMESTAMP] Restarting application with PM2" | tee -a $LOG_FILE

cd $APP_DIR

if sudo -u $APP_USER pm2 list | grep -q "app"; then
  # App exists in PM2, restart it
  echo "[$TIMESTAMP] Application exists in PM2, restarting" | tee -a $LOG_FILE
  sudo -u $APP_USER pm2 restart all
else
  # App doesn't exist in PM2, start it
  echo "[$TIMESTAMP] Application not found in PM2, starting fresh" | tee -a $LOG_FILE
  if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    sudo -u $APP_USER pm2 start ecosystem.config.js
  elif [ -f "$APP_DIR/server.js" ]; then
    sudo -u $APP_USER pm2 start server.js
  else
    echo "[$TIMESTAMP] ERROR: Could not find server.js or ecosystem.config.js in $APP_DIR" | tee -a $LOG_FILE
    exit 1
  fi
fi

# 5. Save PM2 configuration
echo "[$TIMESTAMP] Saving PM2 configuration" | tee -a $LOG_FILE
sudo -u $APP_USER pm2 save

# 6. Verify application is running
echo "[$TIMESTAMP] Verifying application is running" | tee -a $LOG_FILE
sleep 5

if lsof -ti:$APP_PORT >/dev/null; then
  echo "[$TIMESTAMP] Application is running successfully on port $APP_PORT" | tee -a $LOG_FILE
  
  # Run health check if available
  if [ -f "$APP_DIR/scripts/health-check.js" ]; then
    echo "[$TIMESTAMP] Running health check" | tee -a $LOG_FILE
    node $APP_DIR/scripts/health-check.js | tee -a $LOG_FILE
    
    # Check exit code
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
      echo "[$TIMESTAMP] Health check passed successfully" | tee -a $LOG_FILE
    else
      echo "[$TIMESTAMP] WARNING: Health check returned non-zero exit code ${PIPESTATUS[0]}" | tee -a $LOG_FILE
    fi
  fi
  
  echo "[$TIMESTAMP] Emergency restart completed successfully" | tee -a $LOG_FILE
  exit 0
else
  echo "[$TIMESTAMP] ERROR: Application failed to start on port $APP_PORT" | tee -a $LOG_FILE
  
  # Additional diagnostic information
  echo "[$TIMESTAMP] PM2 status:" | tee -a $LOG_FILE
  sudo -u $APP_USER pm2 list | tee -a $LOG_FILE
  
  echo "[$TIMESTAMP] Recent logs:" | tee -a $LOG_FILE
  tail -n 20 $APP_DIR/logs/out.log | tee -a $LOG_FILE
  
  echo "[$TIMESTAMP] Emergency restart failed" | tee -a $LOG_FILE
  exit 1
fi 