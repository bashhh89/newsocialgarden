# Production Deployment Scripts

This directory contains scripts designed to help with deployment, monitoring, and maintenance of the application in a production Ubuntu environment.

## Scripts Overview

### 1. `health-check.js`

A comprehensive health check script that monitors the application and its dependencies.

**Features:**
- Checks application availability
- Verifies WeasyPrint service connectivity
- Tests OpenAI API connectivity
- Validates Firebase connectivity
- Checks Resend email service
- Monitors port usage
- Checks disk space and memory usage

**Usage:**
```bash
# Run directly
node scripts/health-check.js

# Run with PM2 on a schedule
pm2 start scripts/health-check.js --name "health-monitor" --cron "*/5 * * * *"
```

### 2. `setup-ubuntu-permissions.sh`

Sets up proper file system permissions for running the application securely on Ubuntu.

**Features:**
- Creates application user and group
- Sets up directory structure
- Configures proper ownership and permissions
- Secures sensitive files
- Configures PM2 to run as the application user

**Usage:**
```bash
# Run as root or with sudo
sudo bash scripts/setup-ubuntu-permissions.sh
```

### 3. `emergency-restart.sh`

Performs an emergency restart of the application if it becomes unresponsive.

**Features:**
- Safely kills processes using the application port
- Saves system status for diagnosis
- Restarts the application using PM2
- Verifies successful restart
- Runs health check to validate application state

**Usage:**
```bash
# Run as root or with sudo
sudo bash scripts/emergency-restart.sh
```

### 4. `setup-logging.js`

Configures a centralized, structured logging system using Winston.

**Features:**
- Structured JSON logging for machine processing
- Different log levels for various severities
- Separate log files for errors, HTTP requests, and PDF generation
- Log rotation with size limits
- Express middleware for HTTP request logging

**Usage:**
```javascript
// Import in your application
const { logger, expressLogger, createPdfLogger } = require('./scripts/setup-logging');

// Use the logger
logger.info('Application started');
logger.error('An error occurred', { error });

// Use the middleware in Express
app.use(expressLogger);

// Create specialized loggers
const pdfLogger = createPdfLogger();
pdfLogger.info('PDF generation started', { reportId });
```

### 5. `monitoring-dashboard.js`

Provides a real-time web dashboard for monitoring application health and performance.

**Features:**
- Live status monitoring of all services
- System resource usage tracking
- Response time metrics
- Recent errors and requests display
- Auto-refreshing interface

**Usage:**
```bash
# Start the dashboard
node scripts/monitoring-dashboard.js

# Configure as a PM2 service
pm2 start scripts/monitoring-dashboard.js --name "monitoring-dashboard"

# Access the dashboard
# Open http://your-server:8080 in a web browser
```

### 6. `load-test.js`

Performs load testing on the application by simulating multiple concurrent users.

**Features:**
- Configurable number of concurrent users
- Multiple predefined test scenarios (basic, PDF generation, API)
- Realistic user behavior simulation
- Detailed performance metrics
- Response time analysis (min, max, avg, p95)
- Results saved to JSON file

**Usage:**
```bash
# Basic usage with default settings (10 users, 60 seconds)
node scripts/load-test.js

# Custom configuration
node scripts/load-test.js --users=50 --duration=300 --scenario=pdf

# Available options
# --duration=<seconds>   Test duration in seconds (default: 60)
# --users=<number>       Number of concurrent users (default: 10)
# --url=<url>            Target URL (default: http://localhost:3006)
# --rampup=<seconds>     Ramp-up period in seconds (default: 10)
# --scenario=<name>      Test scenario (default: basic, options: basic, pdf, api)
# --verbose              Show detailed output
```

### 7. `security-audit.js`

Performs a comprehensive security audit of the application and its dependencies.

**Features:**
- Checks for vulnerable dependencies using npm audit
- Verifies HTTP security headers
- Scans for sensitive files in public directories
- Validates environment variable configuration
- Identifies outdated dependencies
- Generates detailed security report with severity levels

**Usage:**
```bash
# Run security audit
node scripts/security-audit.js

# Set up as a scheduled task
# Run weekly and send report to security team
pm2 start scripts/security-audit.js --name "security-audit" --cron "0 0 * * 0" --no-autorestart

# The script returns different exit codes based on findings:
# 0: No critical or high issues found
# 1: High severity issues found
# 2: Critical severity issues found
# 3: Error running the audit
```

### 8. `api-key-management.js`

Manages API keys with a focus on security and regular rotation.

**Features:**
- Tracks API key rotation schedule
- Provides key rotation instructions for each service
- Monitors key usage and warns about overdue rotations
- Securely tracks key fingerprints without exposing actual keys
- Maintains rotation history for security auditing

**Usage:**
```bash
# Check status of all API keys
node scripts/api-key-management.js status

# Start rotation process for a specific service
node scripts/api-key-management.js rotate openai
node scripts/api-key-management.js rotate firebase
node scripts/api-key-management.js rotate resend

# Set initial rotation date for tracking
node scripts/api-key-management.js set-date openai

# View rotation history
node scripts/api-key-management.js history

# Start continuous monitoring (logs warnings for keys needing rotation)
node scripts/api-key-management.js monitor

# Set up as a scheduled task
pm2 start scripts/api-key-management.js --name "api-key-monitor" --args "monitor" --no-autorestart
```

### 9. `backup-recovery.sh`

Automates backup and recovery procedures for the application.

**Features:**
- Creates full application backups including code, configuration, and data
- Maintains a configurable backup rotation policy
- Provides straightforward restoration from backups
- Logs all backup and recovery operations
- Secures backup files with proper permissions

**Usage:**
```bash
# Run as root or with sudo
# Create a new backup
sudo bash scripts/backup-recovery.sh backup

# List available backups
sudo bash scripts/backup-recovery.sh list

# Restore from a specific backup
sudo bash scripts/backup-recovery.sh restore sg-ai-scorecard_backup_20230101_120000.tar.gz

# Clean up old backups
sudo bash scripts/backup-recovery.sh auto-clean

# Set up automated daily backups with cron
# Add to /etc/crontab:
# 0 2 * * * root /home/nodejs/app/scripts/backup-recovery.sh backup && /home/nodejs/app/scripts/backup-recovery.sh auto-clean
```

### 10. `incident-response.sh`

Provides automated incident response capabilities for diagnosing and resolving production issues.

**Features:**
- Comprehensive system diagnostics
- Port conflict resolution
- Service restart procedures
- Application recovery from backup
- Detailed incident reporting
- Stakeholder communication templates

**Usage:**
```bash
# Run as root or with sudo
# Run diagnostics and generate an incident report
sudo bash scripts/incident-response.sh diagnose

# Clear process using the application port
sudo bash scripts/incident-response.sh fix-port

# Restart the application and related services
sudo bash scripts/incident-response.sh restart-service

# Restore from the latest backup
sudo bash scripts/incident-response.sh restore-latest

# Generate an outage report for stakeholders
sudo bash scripts/incident-response.sh report-outage
```

## GitHub Actions Workflows

### Build with Cache (Ubuntu)

Located at `.github/workflows/build-cache.yml`

**Features:**
- Caches dependencies using pnpm store
- Caches Next.js build output
- Installs dependencies
- Builds the application
- Tests essential services (WeasyPrint, OpenAI, Firebase, Resend)

### Deploy to Ubuntu Server

Located at `.github/workflows/deploy-ubuntu.yml`

**Features:**
- Builds the application with caching
- Creates a standalone deployment package
- Securely copies deployment package to Ubuntu server
- Restarts the application with zero downtime
- Verifies successful deployment

## Integration

These scripts are designed to work together with the GitHub Actions workflows and PM2 process manager to provide a robust deployment and monitoring solution for the application.

To set up complete monitoring:

1. Install PM2: `npm install -g pm2`
2. Configure health check monitoring: `pm2 start scripts/health-check.js --name "health-monitor" --cron "*/5 * * * *"`
3. Set up emergency restart as a cron job:
   ```
   sudo crontab -e
   # Add the following line to run the check every 15 minutes
   */15 * * * * /bin/bash /path/to/scripts/emergency-restart.sh >> /var/log/emergency-restart-cron.log 2>&1
   ```
4. Set up proper permissions: `sudo bash scripts/setup-ubuntu-permissions.sh` 