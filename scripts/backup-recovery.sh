#!/bin/bash
# Backup and Recovery Script for SG AI Scorecard
# This script performs automated backups of the application and provides
# functions for restoring from those backups.

# Configuration
APP_NAME="sg-ai-scorecard"
APP_DIR="/home/nodejs/app"
BACKUP_DIR="/home/nodejs/backups"
ENV_FILE="${APP_DIR}/.env.local"
DATABASE_BACKUP_CMD="firebase-export"  # Replace with actual command if needed
MAX_BACKUPS=7  # Keep a week's worth of daily backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="${APP_NAME}_backup_${TIMESTAMP}.tar.gz"
LOG_FILE="/var/log/backup-recovery.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Check if the script is being run as root
if [ "$EUID" -ne 0 ]; then
  log "Please run as root or with sudo"
  exit 1
fi

# Show usage
show_usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  backup              Create a full backup of the application"
  echo "  list                List available backups"
  echo "  restore <filename>  Restore from a specific backup"
  echo "  auto-clean          Remove backups older than ${MAX_BACKUPS} days"
  echo "  help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 backup           # Create a new backup"
  echo "  $0 list             # List available backups"
  echo "  $0 restore sg-ai-scorecard_backup_20230101_120000.tar.gz  # Restore from backup"
}

# Create backup
create_backup() {
  log "Starting backup process for ${APP_NAME}"
  
  # Create a temporary directory for the backup
  TEMP_DIR=$(mktemp -d)
  log "Created temporary directory: ${TEMP_DIR}"
  
  # 1. Backup the application code
  log "Backing up application code..."
  cp -R "${APP_DIR}" "${TEMP_DIR}/app"
  
  # 2. Backup environment variables
  log "Backing up environment variables..."
  if [ -f "${ENV_FILE}" ]; then
    cp "${ENV_FILE}" "${TEMP_DIR}/env_backup"
  else
    log "Warning: Environment file not found at ${ENV_FILE}"
  fi
  
  # 3. Export data from Firebase (if applicable)
  if command -v "${DATABASE_BACKUP_CMD}" &> /dev/null; then
    log "Backing up database..."
    ${DATABASE_BACKUP_CMD} > "${TEMP_DIR}/database_backup.json" || log "Warning: Database backup failed"
  else
    log "Warning: Database backup command not found"
  fi
  
  # 4. Record system information
  log "Recording system information..."
  {
    echo "Backup created at: $(date)"
    echo "Hostname: $(hostname)"
    echo "System: $(uname -a)"
    echo "Node version: $(node -v)"
    echo "NPM version: $(npm -v)"
    if command -v pnpm &> /dev/null; then
      echo "PNPM version: $(pnpm -v)"
    fi
    if command -v pm2 &> /dev/null; then
      echo "PM2 version: $(pm2 -v)"
      echo "PM2 status:"
      pm2 list
    fi
  } > "${TEMP_DIR}/system_info.txt"
  
  # 5. Create tar archive
  log "Creating backup archive..."
  tar -czf "${BACKUP_DIR}/${BACKUP_FILENAME}" -C "${TEMP_DIR}" .
  
  # 6. Clean up
  log "Cleaning up temporary directory..."
  rm -rf "${TEMP_DIR}"
  
  # 7. Set permissions
  log "Setting permissions..."
  chmod 600 "${BACKUP_DIR}/${BACKUP_FILENAME}"
  
  # 8. Verify backup
  if [ -f "${BACKUP_DIR}/${BACKUP_FILENAME}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILENAME}" | cut -f1)
    log "Backup completed successfully: ${BACKUP_DIR}/${BACKUP_FILENAME} (${BACKUP_SIZE})"
  else
    log "Error: Backup failed"
    exit 1
  fi
}

# List available backups
list_backups() {
  log "Listing available backups:"
  
  if [ ! "$(ls -A "${BACKUP_DIR}")" ]; then
    log "No backups found in ${BACKUP_DIR}"
    return
  fi
  
  echo "Available backups:"
  echo "-----------------"
  
  ls -lh "${BACKUP_DIR}" | grep -v "^total" | while read -r line; do
    filename=$(echo "$line" | awk '{print $NF}')
    size=$(echo "$line" | awk '{print $5}')
    date=$(echo "$line" | awk '{print $6, $7, $8}')
    
    if [[ $filename == *".tar.gz"* ]]; then
      echo "$filename ($size) - $date"
    fi
  done
}

# Restore from backup
restore_backup() {
  BACKUP_FILE="${BACKUP_DIR}/$1"
  
  if [ ! -f "${BACKUP_FILE}" ]; then
    log "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
  fi
  
  log "Starting restoration from backup: ${BACKUP_FILE}"
  
  # Confirm before proceeding
  read -p "WARNING: This will replace the current application. Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Restoration cancelled by user"
    exit 0
  fi
  
  # Create a temporary directory for extraction
  TEMP_DIR=$(mktemp -d)
  log "Created temporary directory: ${TEMP_DIR}"
  
  # 1. Extract the backup
  log "Extracting backup..."
  tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"
  
  # 2. Stop the application
  log "Stopping the application..."
  if command -v pm2 &> /dev/null; then
    pm2 stop all || log "Warning: Failed to stop PM2 processes"
  fi
  
  # 3. Create a backup of the current application
  CURRENT_BACKUP="${BACKUP_DIR}/${APP_NAME}_pre_restore_${TIMESTAMP}.tar.gz"
  log "Creating backup of current application state: ${CURRENT_BACKUP}"
  tar -czf "${CURRENT_BACKUP}" -C "${APP_DIR}" . || log "Warning: Failed to backup current state"
  
  # 4. Clear the application directory
  log "Clearing application directory..."
  rm -rf "${APP_DIR:?}"/* || log "Warning: Failed to clear application directory"
  
  # 5. Restore application code
  log "Restoring application code..."
  cp -R "${TEMP_DIR}/app"/* "${APP_DIR}/" || log "Error: Failed to restore application code"
  
  # 6. Restore environment variables
  if [ -f "${TEMP_DIR}/env_backup" ]; then
    log "Restoring environment variables..."
    cp "${TEMP_DIR}/env_backup" "${ENV_FILE}" || log "Warning: Failed to restore environment variables"
  fi
  
  # 7. Import database data (if applicable)
  if [ -f "${TEMP_DIR}/database_backup.json" ] && command -v "firebase-import" &> /dev/null; then
    log "Restoring database..."
    firebase-import < "${TEMP_DIR}/database_backup.json" || log "Warning: Database restoration failed"
  fi
  
  # 8. Set proper permissions
  log "Setting permissions..."
  chown -R nodejs:nodejs "${APP_DIR}" || log "Warning: Failed to set permissions"
  chmod -R 750 "${APP_DIR}" || log "Warning: Failed to set permissions"
  
  # 9. Restart the application
  log "Restarting the application..."
  if command -v pm2 &> /dev/null; then
    cd "${APP_DIR}" && pm2 restart all || log "Warning: Failed to restart PM2 processes"
  fi
  
  # 10. Clean up
  log "Cleaning up temporary directory..."
  rm -rf "${TEMP_DIR}"
  
  log "Restoration completed successfully"
  log "A backup of the previous state was created at: ${CURRENT_BACKUP}"
}

# Clean old backups
clean_old_backups() {
  log "Cleaning up backups older than ${MAX_BACKUPS} days..."
  
  # Find and delete old backups
  find "${BACKUP_DIR}" -name "${APP_NAME}_backup_*.tar.gz" -type f -mtime +${MAX_BACKUPS} -exec rm {} \;
  
  # Log remaining backup count
  BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "${APP_NAME}_backup_*.tar.gz" -type f | wc -l)
  log "Cleanup completed. ${BACKUP_COUNT} backups remaining."
}

# Main command processing
case "$1" in
  backup)
    create_backup
    ;;
  list)
    list_backups
    ;;
  restore)
    if [ -z "$2" ]; then
      log "Error: No backup file specified"
      show_usage
      exit 1
    fi
    restore_backup "$2"
    ;;
  auto-clean)
    clean_old_backups
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    show_usage
    exit 1
    ;;
esac

exit 0 