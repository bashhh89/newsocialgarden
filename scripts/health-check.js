#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * This script performs comprehensive health checks on the application and its dependencies.
 * It can be used with PM2, monitoring systems, or as a standalone check.
 * 
 * Usage:
 *   - Run directly: node health-check.js
 *   - With PM2: pm2 start health-check.js --name "health-monitor" --cron "*/5 * * * *"
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APP_PORT = process.env.PORT || 3006;
const APP_HOST = 'localhost';
const WEASYPRINT_SERVICE_URL = process.env.WEASYPRINT_SERVICE_URL || 'http://168.231.115.219:5001';
const LOG_FILE = path.join(__dirname, '../logs/health-check.log');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize log with timestamp
const timestamp = new Date().toISOString();
const logEntry = `\n\n===== Health Check: ${timestamp} =====\n`;
fs.appendFileSync(LOG_FILE, logEntry);

// Health check results
const results = {
  app: { status: 'unknown', message: '' },
  weasyprint: { status: 'unknown', message: '' },
  openai: { status: 'unknown', message: '' },
  firebase: { status: 'unknown', message: '' },
  resend: { status: 'unknown', message: '' },
  port: { status: 'unknown', message: '' },
  disk: { status: 'unknown', message: '' },
  memory: { status: 'unknown', message: '' }
};

// Helper function to log results
function logResult(service, status, message) {
  results[service] = { status, message };
  const logMessage = `${service}: ${status.toUpperCase()} - ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(logMessage);
}

// Helper function for HTTP requests
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// 1. Check if app is running
async function checkAppHealth() {
  try {
    const response = await httpRequest(`http://${APP_HOST}:${APP_PORT}/`);
    if (response.statusCode >= 200 && response.statusCode < 400) {
      logResult('app', 'ok', `App is running (status ${response.statusCode})`);
    } else {
      logResult('app', 'error', `App returned status ${response.statusCode}`);
    }
  } catch (error) {
    logResult('app', 'error', `App is not reachable: ${error.message}`);
  }
}

// 2. Check WeasyPrint service
async function checkWeasyPrintService() {
  try {
    const response = await httpRequest(`${WEASYPRINT_SERVICE_URL}/health`);
    if (response.statusCode === 200) {
      logResult('weasyprint', 'ok', 'WeasyPrint service is operational');
    } else {
      logResult('weasyprint', 'warning', `WeasyPrint service returned status ${response.statusCode}`);
    }
  } catch (error) {
    logResult('weasyprint', 'error', `WeasyPrint service is not reachable: ${error.message}`);
  }
}

// 3. Check OpenAI API connectivity
async function checkOpenAIConnectivity() {
  if (!process.env.OPENAI_API_KEY) {
    logResult('openai', 'warning', 'OPENAI_API_KEY not set');
    return;
  }
  
  try {
    // Simple request to OpenAI API
    const response = await httpRequest('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      logResult('openai', 'ok', 'OpenAI API is accessible');
    } else {
      logResult('openai', 'warning', `OpenAI API returned status ${response.statusCode}`);
    }
  } catch (error) {
    logResult('openai', 'error', `OpenAI API error: ${error.message}`);
  }
}

// 4. Check Firebase connectivity
function checkFirebaseConnectivity() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    logResult('firebase', 'warning', 'Firebase API key not set');
    return;
  }
  
  try {
    // We'll use the test script that should already exist
    execSync('node test-firebase-connectivity.js', { stdio: 'pipe' });
    logResult('firebase', 'ok', 'Firebase connectivity test passed');
  } catch (error) {
    logResult('firebase', 'error', `Firebase connectivity test failed: ${error.message}`);
  }
}

// 5. Check Resend Email service
function checkResendService() {
  if (!process.env.RESEND_API_KEY) {
    logResult('resend', 'warning', 'RESEND_API_KEY not set');
    return;
  }
  
  try {
    // We'll use the test script that should already exist
    execSync('node test-resend-connectivity.js', { stdio: 'pipe' });
    logResult('resend', 'ok', 'Resend email service test passed');
  } catch (error) {
    logResult('resend', 'error', `Resend email service test failed: ${error.message}`);
  }
}

// 6. Check if port is available or being used by the correct process
function checkPortUsage() {
  try {
    // On Unix systems
    let cmd = '';
    if (process.platform === 'win32') {
      cmd = `netstat -ano | findstr :${APP_PORT}`;
    } else {
      cmd = `lsof -i:${APP_PORT} -sTCP:LISTEN -t`;
    }
    
    const output = execSync(cmd, { stdio: 'pipe' }).toString();
    
    if (!output.trim()) {
      logResult('port', 'warning', `Port ${APP_PORT} is not in use by any process`);
    } else {
      // Check if the port is used by Node.js/PM2
      if (process.platform === 'win32') {
        const pid = output.trim().split(/\s+/).pop();
        const processCmd = execSync(`tasklist /fi "PID eq ${pid}" /fo csv /nh`, { stdio: 'pipe' }).toString();
        
        if (processCmd.includes('node.exe') || processCmd.includes('pm2')) {
          logResult('port', 'ok', `Port ${APP_PORT} is being used by the correct process (PID: ${pid})`);
        } else {
          logResult('port', 'warning', `Port ${APP_PORT} is being used by another process: ${processCmd}`);
        }
      } else {
        // For Unix systems
        const pid = output.trim();
        const processCmd = execSync(`ps -p ${pid} -o comm=`, { stdio: 'pipe' }).toString();
        
        if (processCmd.includes('node') || processCmd.includes('pm2')) {
          logResult('port', 'ok', `Port ${APP_PORT} is being used by the correct process (PID: ${pid})`);
        } else {
          logResult('port', 'warning', `Port ${APP_PORT} is being used by another process: ${processCmd}`);
        }
      }
    }
  } catch (error) {
    // If the command fails, likely no process is using the port
    logResult('port', 'warning', `Port ${APP_PORT} check failed: ${error.message}`);
  }
}

// 7. Check disk space
function checkDiskSpace() {
  try {
    let cmd = '';
    if (process.platform === 'win32') {
      cmd = 'wmic logicaldisk get size,freespace,caption';
    } else {
      cmd = 'df -h /';
    }
    
    const output = execSync(cmd, { stdio: 'pipe' }).toString();
    
    // Simple disk space check
    if (process.platform === 'win32') {
      // Parse Windows output
      const lines = output.trim().split('\n');
      const drives = [];
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 3) {
          const drive = parts[0];
          const freeSpace = parseInt(parts[1], 10) / (1024 * 1024 * 1024); // Convert to GB
          const totalSize = parseInt(parts[2], 10) / (1024 * 1024 * 1024); // Convert to GB
          const percentUsed = ((totalSize - freeSpace) / totalSize) * 100;
          
          drives.push({ drive, freeSpace, totalSize, percentUsed });
        }
      }
      
      if (drives.length > 0) {
        // Check if any drive has less than 10% free space
        const lowSpaceDrives = drives.filter(drive => drive.percentUsed > 90);
        
        if (lowSpaceDrives.length > 0) {
          logResult('disk', 'warning', `Low disk space on drives: ${lowSpaceDrives.map(d => `${d.drive} (${d.percentUsed.toFixed(1)}% used)`).join(', ')}`);
        } else {
          logResult('disk', 'ok', `Disk space is sufficient on all drives`);
        }
      } else {
        logResult('disk', 'warning', 'Could not parse disk space information');
      }
    } else {
      // Parse Unix output
      const lines = output.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].trim().split(/\s+/);
        if (parts.length >= 5) {
          const percentUsed = parseInt(parts[4], 10);
          
          if (percentUsed > 90) {
            logResult('disk', 'warning', `Low disk space: ${parts[4]} used`);
          } else {
            logResult('disk', 'ok', `Disk space is sufficient: ${parts[4]} used`);
          }
        } else {
          logResult('disk', 'warning', 'Could not parse disk space information');
        }
      } else {
        logResult('disk', 'warning', 'Could not parse disk space information');
      }
    }
  } catch (error) {
    logResult('disk', 'error', `Disk space check failed: ${error.message}`);
  }
}

// 8. Check memory usage
function checkMemoryUsage() {
  try {
    let cmd = '';
    let memoryThreshold = 90; // 90% memory usage is considered high
    
    if (process.platform === 'win32') {
      cmd = 'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value';
    } else {
      cmd = 'free -m';
    }
    
    const output = execSync(cmd, { stdio: 'pipe' }).toString();
    
    if (process.platform === 'win32') {
      // Parse Windows output
      const freeMatch = output.match(/FreePhysicalMemory=(\d+)/);
      const totalMatch = output.match(/TotalVisibleMemorySize=(\d+)/);
      
      if (freeMatch && totalMatch) {
        const freeMemory = parseInt(freeMatch[1], 10);
        const totalMemory = parseInt(totalMatch[1], 10);
        const usedPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
        
        if (usedPercent > memoryThreshold) {
          logResult('memory', 'warning', `High memory usage: ${usedPercent.toFixed(1)}%`);
        } else {
          logResult('memory', 'ok', `Memory usage is normal: ${usedPercent.toFixed(1)}%`);
        }
      } else {
        logResult('memory', 'warning', 'Could not parse memory information');
      }
    } else {
      // Parse Unix output
      const lines = output.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].trim().split(/\s+/);
        if (parts.length >= 3) {
          const total = parseInt(parts[1], 10);
          const used = parseInt(parts[2], 10);
          const usedPercent = (used / total) * 100;
          
          if (usedPercent > memoryThreshold) {
            logResult('memory', 'warning', `High memory usage: ${usedPercent.toFixed(1)}%`);
          } else {
            logResult('memory', 'ok', `Memory usage is normal: ${usedPercent.toFixed(1)}%`);
          }
        } else {
          logResult('memory', 'warning', 'Could not parse memory information');
        }
      } else {
        logResult('memory', 'warning', 'Could not parse memory information');
      }
    }
  } catch (error) {
    logResult('memory', 'error', `Memory check failed: ${error.message}`);
  }
}

// Run all checks
async function runHealthChecks() {
  try {
    // Run checks in parallel
    await Promise.all([
      checkAppHealth(),
      checkWeasyPrintService(),
      checkOpenAIConnectivity()
    ]);
    
    // Run checks that use execSync sequentially
    checkFirebaseConnectivity();
    checkResendService();
    checkPortUsage();
    checkDiskSpace();
    checkMemoryUsage();
    
    // Log summary
    const summary = Object.entries(results).map(([service, { status }]) => `${service}: ${status}`).join(', ');
    fs.appendFileSync(LOG_FILE, `\nSummary: ${summary}\n`);
    console.log(`\nHealth check summary: ${summary}`);
    
    // Determine overall status
    const hasErrors = Object.values(results).some(result => result.status === 'error');
    const hasWarnings = Object.values(results).some(result => result.status === 'warning');
    
    if (hasErrors) {
      console.log('Overall health: ERROR - Critical issues detected');
      process.exit(2);
    } else if (hasWarnings) {
      console.log('Overall health: WARNING - Non-critical issues detected');
      process.exit(1);
    } else {
      console.log('Overall health: OK - All systems operational');
      process.exit(0);
    }
  } catch (error) {
    console.error('Health check failed:', error);
    fs.appendFileSync(LOG_FILE, `\nHealth check error: ${error.message}\n`);
    process.exit(3);
  }
}

// Run the health checks
runHealthChecks(); 