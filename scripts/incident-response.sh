#!/bin/bash
# Incident Response Script for SG AI Scorecard
# This script provides an automated response to common production incidents
# and helps with diagnosis, mitigation, and communication.

# Configuration
APP_NAME="sg-ai-scorecard"
APP_DIR="/home/nodejs/app"
LOG_DIR="/home/nodejs/logs"
INCIDENT_LOG="${LOG_DIR}/incidents.log"
REPORTS_DIR="${LOG_DIR}/incident_reports"
APP_PORT=3006
ADMIN_EMAIL="admin@example.com"  # Replace with actual admin email
TEAM_EMAILS="team@example.com"   # Replace with actual team emails
INCIDENT_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
INCIDENT_ID="INC${INCIDENT_TIMESTAMP}"

# Create necessary directories
mkdir -p "${REPORTS_DIR}"

# Log function
log() {
  echo "[${INCIDENT_ID} $(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${INCIDENT_LOG}"
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
  echo "  diagnose             Run diagnostics and generate an incident report"
  echo "  fix-port             Clear process using the application port"
  echo "  restart-service      Restart the application and related services"
  echo "  restore-latest       Restore from the latest backup"
  echo "  report-outage        Generate an outage report for stakeholders"
  echo "  help                 Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 diagnose          # Run diagnostics and generate report"
  echo "  $0 fix-port          # Fix port conflict issues"
}

# Run comprehensive diagnostics
run_diagnostics() {
  log "Starting comprehensive diagnostics for incident ${INCIDENT_ID}"
  
  # Create a report directory for this incident
  REPORT_DIR="${REPORTS_DIR}/${INCIDENT_ID}"
  mkdir -p "${REPORT_DIR}"
  
  # 1. System information
  log "Collecting system information..."
  {
    echo "===== SYSTEM INFORMATION ====="
    echo "Incident ID: ${INCIDENT_ID}"
    echo "Timestamp: $(date)"
    echo "Hostname: $(hostname)"
    echo "System: $(uname -a)"
    echo "Uptime: $(uptime)"
    echo "Memory usage:"
    free -h
    echo -e "\nDisk usage:"
    df -h
    echo -e "\nCPU info:"
    lscpu | grep "Model name"
    echo -e "\nOpen file handles:"
    lsof | wc -l
  } > "${REPORT_DIR}/system_info.txt"
  
  # 2. Network diagnostics
  log "Running network diagnostics..."
  {
    echo "===== NETWORK DIAGNOSTICS ====="
    echo -e "\nNetwork interfaces:"
    ip addr
    echo -e "\nOpen ports:"
    netstat -tuln
    echo -e "\nPort ${APP_PORT} status:"
    netstat -tuln | grep ${APP_PORT} || echo "Port ${APP_PORT} is not in use"
    echo -e "\nConnection count:"
    netstat -an | grep ESTABLISHED | wc -l
    echo -e "\nExternal connectivity:"
    ping -c 3 google.com || echo "External connectivity failed"
  } > "${REPORT_DIR}/network_diagnostics.txt"
  
  # 3. Application status
  log "Checking application status..."
  {
    echo "===== APPLICATION STATUS ====="
    echo -e "\nPM2 processes:"
    pm2 list || echo "PM2 not running or not installed"
    echo -e "\nApplication logs (last 50 lines):"
    tail -n 50 "${LOG_DIR}/out.log" 2>/dev/null || echo "No application logs found"
    echo -e "\nError logs (last 50 lines):"
    tail -n 50 "${LOG_DIR}/error.log" 2>/dev/null || echo "No error logs found"
    echo -e "\nProcess using port ${APP_PORT}:"
    lsof -i:${APP_PORT} || echo "No process using port ${APP_PORT}"
  } > "${REPORT_DIR}/application_status.txt"
  
  # 4. Resource usage
  log "Analyzing resource usage..."
  {
    echo "===== RESOURCE USAGE ====="
    echo -e "\nTop processes by CPU:"
    ps aux --sort=-%cpu | head -n 10
    echo -e "\nTop processes by memory:"
    ps aux --sort=-%mem | head -n 10
    echo -e "\nIO wait:"
    iostat 1 5
  } > "${REPORT_DIR}/resource_usage.txt"
  
  # 5. Check for common errors
  log "Checking for common errors..."
  {
    echo "===== COMMON ERRORS ====="
    echo -e "\nOut of memory events:"
    dmesg | grep -i "out of memory" | tail -n 20 || echo "No OOM events found"
    echo -e "\nSegmentation faults:"
    dmesg | grep -i "segfault" | tail -n 20 || echo "No segfaults found"
    echo -e "\nNode.js specific errors (last 20):"
    grep -i "error" "${LOG_DIR}/out.log" | grep -i "node" | tail -n 20 || echo "No Node.js errors found"
    echo -e "\nFirebase errors (last 20):"
    grep -i "firebase" "${LOG_DIR}/error.log" | tail -n 20 || echo "No Firebase errors found"
    echo -e "\nWeasyPrint errors (last 20):"
    grep -i "weasyprint" "${LOG_DIR}/error.log" | tail -n 20 || echo "No WeasyPrint errors found"
  } > "${REPORT_DIR}/common_errors.txt"
  
  # 6. Environment check
  log "Checking environment..."
  {
    echo "===== ENVIRONMENT CHECK ====="
    echo -e "\nNode.js version:"
    node -v || echo "Node.js not found"
    echo -e "\nNPM version:"
    npm -v || echo "NPM not found"
    echo -e "\nPNPM version:"
    pnpm -v || echo "PNPM not found"
    echo -e "\nPython version:"
    python3 -V || echo "Python not found"
    echo -e "\nWeasyPrint version:"
    weasyprint --version || echo "WeasyPrint not found"
    echo -e "\nEnvironment variables (redacted):"
    env | grep -v "SECRET\|KEY\|PASSWORD\|TOKEN" | sort
  } > "${REPORT_DIR}/environment_check.txt"
  
  # Generate summary
  log "Generating incident summary..."
  {
    echo "===== INCIDENT SUMMARY ====="
    echo "Incident ID: ${INCIDENT_ID}"
    echo "Timestamp: $(date)"
    
    # Check for port availability
    if lsof -i:${APP_PORT} > /dev/null; then
      echo "✓ Port ${APP_PORT} is in use"
      echo "  → Process: $(lsof -i:${APP_PORT} | awk 'NR>1 {print $1}')"
    else
      echo "✗ Port ${APP_PORT} is not in use"
      echo "  → Recommendation: Restart the application service"
    fi
    
    # Check for application service
    if pm2 list | grep -q "${APP_NAME}"; then
      if pm2 list | grep -q "${APP_NAME}" | grep -q "online"; then
        echo "✓ Application service is running"
      else
        echo "✗ Application service is not in 'online' state"
        echo "  → Recommendation: Restart the application service"
      fi
    else
      echo "✗ Application service is not registered with PM2"
      echo "  → Recommendation: Start the application service"
    fi
    
    # Check for high resource usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
      echo "✗ High CPU usage detected: ${CPU_USAGE}%"
      echo "  → Recommendation: Investigate resource-intensive processes"
    else
      echo "✓ CPU usage is normal: ${CPU_USAGE}%"
    fi
    
    # Check for disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
      echo "✗ Low disk space: ${DISK_USAGE}%"
      echo "  → Recommendation: Free up disk space"
    else
      echo "✓ Disk space is adequate: ${DISK_USAGE}%"
    fi
    
    # Check for recent OOM or crashes
    if dmesg | grep -i "out of memory" | grep -q "$(date +%s --date='1 hour ago')"; then
      echo "✗ Recent out-of-memory events detected"
      echo "  → Recommendation: Increase available memory or optimize application"
    else
      echo "✓ No recent out-of-memory events"
    fi
    
    # Check database connectivity (for Firebase, we check if the logs contain Firebase errors)
    if grep -i "firebase" "${LOG_DIR}/error.log" | grep -q "$(date +%Y-%m-%d)"; then
      echo "✗ Recent Firebase errors detected"
      echo "  → Recommendation: Check Firebase connectivity"
    else
      echo "✓ No recent Firebase errors detected"
    fi
    
    # Check WeasyPrint service
    if grep -i "weasyprint" "${LOG_DIR}/error.log" | grep -q "$(date +%Y-%m-%d)"; then
      echo "✗ Recent WeasyPrint errors detected"
      echo "  → Recommendation: Check WeasyPrint service"
    else
      echo "✓ No recent WeasyPrint errors detected"
    fi
    
    echo -e "\nIncident report files are available at: ${REPORT_DIR}"
  } > "${REPORT_DIR}/summary.txt"
  
  # Display summary
  cat "${REPORT_DIR}/summary.txt"
  
  log "Diagnostics completed. Report saved to ${REPORT_DIR}"
}

# Fix port conflict issues
fix_port_conflict() {
  log "Checking for processes using port ${APP_PORT}..."
  
  # Check if the port is in use
  if ! lsof -i:${APP_PORT} > /dev/null; then
    log "Port ${APP_PORT} is not in use. No action needed."
    return
  fi
  
  # Get process information
  PROCESS_INFO=$(lsof -i:${APP_PORT})
  PROCESS_PID=$(echo "$PROCESS_INFO" | awk 'NR>1 {print $2}' | head -n 1)
  PROCESS_NAME=$(echo "$PROCESS_INFO" | awk 'NR>1 {print $1}' | head -n 1)
  
  log "Port ${APP_PORT} is being used by ${PROCESS_NAME} (PID: ${PROCESS_PID})"
  
  # If it's our application, try to restart it properly
  if [[ "$PROCESS_NAME" == "node" ]] && pm2 list | grep -q "${APP_NAME}"; then
    log "This appears to be our application. Attempting to restart it properly..."
    pm2 restart "${APP_NAME}" || pm2 restart all
    
    sleep 5
    
    # Check if the restart worked
    if pm2 list | grep -q "${APP_NAME}" | grep -q "online"; then
      log "Application restarted successfully."
      return
    else
      log "Application did not restart properly. Will attempt to kill the process."
    fi
  fi
  
  # Ask for confirmation before killing
  read -p "Kill process ${PROCESS_NAME} (PID: ${PROCESS_PID}) using port ${APP_PORT}? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Operation cancelled by user."
    return
  fi
  
  # Kill the process
  log "Killing process ${PROCESS_PID}..."
  kill -15 "${PROCESS_PID}" || kill -9 "${PROCESS_PID}"
  
  # Check if the kill was successful
  sleep 2
  if lsof -i:${APP_PORT} | grep -q "${PROCESS_PID}"; then
    log "Process is still running. Attempting forceful kill..."
    kill -9 "${PROCESS_PID}"
    sleep 2
  fi
  
  # Final check
  if lsof -i:${APP_PORT} > /dev/null; then
    log "ERROR: Failed to free port ${APP_PORT}. Manual intervention required."
  else
    log "Port ${APP_PORT} is now free."
    log "You can now restart the application."
  fi
}

# Restart application and services
restart_services() {
  log "Initiating service restart procedure..."
  
  # 1. Stop the application
  log "Stopping application services..."
  if command -v pm2 &> /dev/null; then
    pm2 stop all || log "Warning: Failed to stop PM2 processes"
  fi
  
  # 2. Check for and clear port conflicts
  log "Checking for port conflicts..."
  if lsof -i:${APP_PORT} > /dev/null; then
    log "Port ${APP_PORT} is still in use. Attempting to clear..."
    PROCESS_PID=$(lsof -i:${APP_PORT} | awk 'NR>1 {print $2}' | head -n 1)
    kill -9 "${PROCESS_PID}" || log "Warning: Failed to kill process using port ${APP_PORT}"
    sleep 2
  fi
  
  # 3. Restart related services if needed
  log "Checking related services..."
  # Example: Restart WeasyPrint service if it exists
  if systemctl list-units --type=service | grep -q "weasyprint"; then
    log "Restarting WeasyPrint service..."
    systemctl restart weasyprint || log "Warning: Failed to restart WeasyPrint service"
  fi
  
  # 4. Start the application
  log "Starting application services..."
  if [ -f "${APP_DIR}/ecosystem.config.js" ]; then
    cd "${APP_DIR}" && pm2 start ecosystem.config.js || log "Error: Failed to start application with PM2"
  else
    cd "${APP_DIR}" && pm2 start npm --name "${APP_NAME}" -- start || log "Error: Failed to start application with PM2"
  fi
  
  # 5. Verify services are running
  log "Verifying services..."
  sleep 5
  
  if pm2 list | grep -q "${APP_NAME}" | grep -q "online"; then
    log "Application services started successfully."
  else
    log "Error: Application services failed to start properly."
    return 1
  fi
  
  # 6. Check application accessibility
  log "Checking application accessibility..."
  if curl -s http://localhost:${APP_PORT} -o /dev/null; then
    log "Application is accessible on port ${APP_PORT}."
  else
    log "Warning: Application is not responding on port ${APP_PORT}."
  fi
  
  log "Service restart procedure completed."
}

# Restore from latest backup
restore_latest_backup() {
  log "Attempting to restore from the latest backup..."
  
  # 1. Find the latest backup
  BACKUP_DIR="/home/nodejs/backups"
  LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/${APP_NAME}_backup_*.tar.gz 2>/dev/null | head -n 1)
  
  if [ -z "${LATEST_BACKUP}" ]; then
    log "Error: No backups found in ${BACKUP_DIR}"
    return 1
  fi
  
  BACKUP_FILENAME=$(basename "${LATEST_BACKUP}")
  log "Latest backup found: ${BACKUP_FILENAME}"
  
  # 2. Confirm restoration
  read -p "Restore from backup ${BACKUP_FILENAME}? This will replace the current application state. (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Restoration cancelled by user."
    return
  fi
  
  # 3. Use the backup-recovery script to restore
  if [ -f "${APP_DIR}/scripts/backup-recovery.sh" ]; then
    log "Using backup-recovery.sh script to restore..."
    bash "${APP_DIR}/scripts/backup-recovery.sh" restore "${BACKUP_FILENAME}"
  else
    log "Error: Backup recovery script not found. Manual restoration required."
    return 1
  fi
  
  log "Restoration procedure completed."
}

# Generate an outage report for stakeholders
generate_outage_report() {
  log "Generating outage report for incident ${INCIDENT_ID}..."
  
  # Get the latest incident report directory
  if [ -z "${REPORT_DIR}" ]; then
    REPORT_DIR=$(ls -td "${REPORTS_DIR}"/* | head -n 1)
  fi
  
  if [ ! -d "${REPORT_DIR}" ]; then
    log "Error: No incident report found. Run diagnostics first."
    return 1
  fi
  
  # Create the outage report
  OUTAGE_REPORT="${REPORT_DIR}/outage_report.txt"
  
  {
    echo "===== OUTAGE REPORT ====="
    echo "Incident ID: ${INCIDENT_ID}"
    echo "Date/Time: $(date)"
    echo "System: $(hostname)"
    echo ""
    echo "--- INCIDENT SUMMARY ---"
    
    # Extract summary information if available
    if [ -f "${REPORT_DIR}/summary.txt" ]; then
      grep -v "===== INCIDENT SUMMARY =====" "${REPORT_DIR}/summary.txt"
    else
      echo "No summary information available."
    fi
    
    echo ""
    echo "--- SERVICE IMPACT ---"
    if [ -f "${REPORT_DIR}/application_status.txt" ]; then
      if grep -q "PM2 not running" "${REPORT_DIR}/application_status.txt"; then
        echo "* Complete service outage - Application service not running"
      elif lsof -i:${APP_PORT} > /dev/null; then
        echo "* Service is operational but may be experiencing issues"
      else
        echo "* Partial service outage - Application is not responding on port ${APP_PORT}"
      fi
    else
      echo "* Service impact assessment not available"
    fi
    
    echo ""
    echo "--- ACTIONS TAKEN ---"
    echo "* Incident response procedure initiated"
    echo "* Comprehensive diagnostics performed"
    if [ -f "${INCIDENT_LOG}" ]; then
      grep "${INCIDENT_ID}" "${INCIDENT_LOG}" | grep -v "Starting comprehensive diagnostics" | sed 's/\[.*\] /\* /'
    fi
    
    echo ""
    echo "--- RESOLUTION STATUS ---"
    # Check current application status
    if pm2 list | grep -q "${APP_NAME}" | grep -q "online" && curl -s http://localhost:${APP_PORT} -o /dev/null; then
      echo "* RESOLVED - Service has been restored"
      echo "* Resolution time: $(date)"
    else
      echo "* ONGOING - Service restoration in progress"
      echo "* Estimated time to resolution: Unknown"
    fi
    
    echo ""
    echo "--- PREVENTION MEASURES ---"
    echo "* A thorough post-incident review will be conducted"
    echo "* Additional monitoring will be implemented to detect similar issues"
    echo "* System resources will be evaluated to prevent recurrence"
    
    echo ""
    echo "This report was automatically generated by the incident response system."
    echo "For more information, please contact the system administrator."
  } > "${OUTAGE_REPORT}"
  
  log "Outage report generated at ${OUTAGE_REPORT}"
  
  # Display the report
  cat "${OUTAGE_REPORT}"
  
  # Send the report via email (commented out for now)
  # if command -v mail &> /dev/null; then
  #   log "Sending outage report via email..."
  #   cat "${OUTAGE_REPORT}" | mail -s "[INCIDENT] ${INCIDENT_ID} - System Outage Report" "${TEAM_EMAILS}"
  # fi
}

# Main command processing
case "$1" in
  diagnose)
    run_diagnostics
    ;;
  fix-port)
    fix_port_conflict
    ;;
  restart-service)
    restart_services
    ;;
  restore-latest)
    restore_latest_backup
    ;;
  report-outage)
    generate_outage_report
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