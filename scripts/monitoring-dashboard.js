/**
 * Monitoring Dashboard Script
 * 
 * This script provides a simple HTTP server that displays the health status
 * of the application and its dependencies. It can be accessed via a web browser.
 * 
 * Usage:
 *   node scripts/monitoring-dashboard.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { logger } = require('./setup-logging');

// Configuration
const PORT = process.env.DASHBOARD_PORT || 8080;
const APP_PORT = process.env.PORT || 3006;
const WEASYPRINT_SERVICE_URL = process.env.WEASYPRINT_SERVICE_URL || 'http://168.231.115.219:5001';
const LOG_DIR = path.join(__dirname, '../logs');
const REFRESH_INTERVAL = 30; // seconds

// Health status storage
const healthStatus = {
  app: { status: 'unknown', message: '', lastChecked: null },
  weasyprint: { status: 'unknown', message: '', lastChecked: null },
  openai: { status: 'unknown', message: '', lastChecked: null },
  firebase: { status: 'unknown', message: '', lastChecked: null },
  resend: { status: 'unknown', message: '', lastChecked: null },
  system: { status: 'unknown', message: '', lastChecked: null },
  recentErrors: [],
  recentRequests: []
};

// Performance metrics
const performanceMetrics = {
  apiLatency: {},
  responseTime: {
    avg: 0,
    p95: 0,
    max: 0
  },
  memory: {
    used: 0,
    total: 0,
    percentage: 0
  },
  cpu: {
    usage: 0
  },
  disk: {
    used: 0,
    total: 0,
    percentage: 0
  }
};

// Helper function to make HTTP requests
function httpRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Check application health
async function checkAppHealth() {
  try {
    const startTime = Date.now();
    const response = await httpRequest(`http://localhost:${APP_PORT}/`);
    const duration = Date.now() - startTime;
    
    if (response.statusCode >= 200 && response.statusCode < 400) {
      healthStatus.app = { 
        status: 'ok', 
        message: `App is running (${response.statusCode}, ${duration}ms)`,
        lastChecked: new Date() 
      };
    } else {
      healthStatus.app = { 
        status: 'error', 
        message: `App returned status ${response.statusCode}`,
        lastChecked: new Date() 
      };
    }
  } catch (error) {
    healthStatus.app = { 
      status: 'error', 
      message: `App is not reachable: ${error.message}`,
      lastChecked: new Date() 
    };
  }
}

// Check WeasyPrint service
async function checkWeasyPrintService() {
  try {
    const startTime = Date.now();
    const response = await httpRequest(`${WEASYPRINT_SERVICE_URL}/health`);
    const duration = Date.now() - startTime;
    
    if (response.statusCode === 200) {
      healthStatus.weasyprint = { 
        status: 'ok', 
        message: `WeasyPrint service is operational (${duration}ms)`,
        lastChecked: new Date() 
      };
    } else {
      healthStatus.weasyprint = { 
        status: 'warning', 
        message: `WeasyPrint service returned status ${response.statusCode}`,
        lastChecked: new Date() 
      };
    }
  } catch (error) {
    healthStatus.weasyprint = { 
      status: 'error', 
      message: `WeasyPrint service is not reachable: ${error.message}`,
      lastChecked: new Date() 
    };
  }
}

// Check OpenAI API
function checkOpenAI() {
  exec('node test-openai-connectivity.js', (error, stdout, stderr) => {
    if (error) {
      healthStatus.openai = { 
        status: 'error', 
        message: `OpenAI API error: ${stderr || error.message}`,
        lastChecked: new Date() 
      };
      return;
    }
    
    healthStatus.openai = { 
      status: 'ok', 
      message: `OpenAI API is accessible`,
      lastChecked: new Date() 
    };
  });
}

// Check Firebase
function checkFirebase() {
  exec('node test-firebase-connectivity.js', (error, stdout, stderr) => {
    if (error) {
      healthStatus.firebase = { 
        status: 'error', 
        message: `Firebase error: ${stderr || error.message}`,
        lastChecked: new Date() 
      };
      return;
    }
    
    healthStatus.firebase = { 
      status: 'ok', 
      message: `Firebase is accessible`,
      lastChecked: new Date() 
    };
  });
}

// Check Resend
function checkResend() {
  exec('node test-resend-connectivity.js', (error, stdout, stderr) => {
    if (error) {
      healthStatus.resend = { 
        status: 'error', 
        message: `Resend API error: ${stderr || error.message}`,
        lastChecked: new Date() 
      };
      return;
    }
    
    healthStatus.resend = { 
      status: 'ok', 
      message: `Resend API is accessible`,
      lastChecked: new Date() 
    };
  });
}

// Check system resources
function checkSystem() {
  // Check memory
  exec('free -m', (error, stdout, stderr) => {
    if (error) {
      healthStatus.system.memory = 'Error checking memory';
      return;
    }
    
    try {
      const lines = stdout.trim().split('\n');
      const memInfo = lines[1].trim().split(/\s+/);
      const total = parseInt(memInfo[1], 10);
      const used = parseInt(memInfo[2], 10);
      const percentage = Math.round((used / total) * 100);
      
      performanceMetrics.memory = {
        used,
        total,
        percentage
      };
      
      if (percentage > 90) {
        healthStatus.system = { 
          status: 'warning', 
          message: `High memory usage: ${percentage}%`,
          lastChecked: new Date() 
        };
      } else {
        healthStatus.system = { 
          status: 'ok', 
          message: `System resources are normal`,
          lastChecked: new Date() 
        };
      }
    } catch (err) {
      logger.error('Error parsing memory info', { error: err });
    }
  });
  
  // Check disk space
  exec('df -h /', (error, stdout, stderr) => {
    if (error) {
      return;
    }
    
    try {
      const lines = stdout.trim().split('\n');
      const diskInfo = lines[1].trim().split(/\s+/);
      const used = diskInfo[2];
      const total = diskInfo[1];
      const percentage = parseInt(diskInfo[4], 10);
      
      performanceMetrics.disk = {
        used,
        total,
        percentage
      };
      
      if (percentage > 90) {
        healthStatus.system = { 
          status: 'warning', 
          message: `Low disk space: ${percentage}% used`,
          lastChecked: new Date() 
        };
      }
    } catch (err) {
      logger.error('Error parsing disk info', { error: err });
    }
  });
  
  // Check CPU load
  exec('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'', 
    (error, stdout, stderr) => {
      if (error) {
        return;
      }
      
      try {
        const cpuUsage = parseFloat(stdout.trim());
        performanceMetrics.cpu.usage = cpuUsage;
        
        if (cpuUsage > 90) {
          healthStatus.system = { 
            status: 'warning', 
            message: `High CPU usage: ${cpuUsage.toFixed(1)}%`,
            lastChecked: new Date() 
          };
        }
      } catch (err) {
        logger.error('Error parsing CPU info', { error: err });
      }
    }
  );
}

// Check recent errors in logs
function checkRecentErrors() {
  const errorLogPath = path.join(LOG_DIR, 'error.log');
  
  if (!fs.existsSync(errorLogPath)) {
    return;
  }
  
  exec(`tail -n 10 ${errorLogPath}`, (error, stdout, stderr) => {
    if (error) {
      return;
    }
    
    try {
      const lines = stdout.trim().split('\n');
      healthStatus.recentErrors = lines.map(line => {
        try {
          const parsed = JSON.parse(line);
          return {
            timestamp: parsed.timestamp,
            message: parsed.message,
            level: parsed.level
          };
        } catch (e) {
          return { message: line };
        }
      });
    } catch (err) {
      logger.error('Error parsing error logs', { error: err });
    }
  });
}

// Check recent requests
function checkRecentRequests() {
  const apiLogPath = path.join(LOG_DIR, 'api.log');
  
  if (!fs.existsSync(apiLogPath)) {
    return;
  }
  
  exec(`tail -n 10 ${apiLogPath}`, (error, stdout, stderr) => {
    if (error) {
      return;
    }
    
    try {
      const lines = stdout.trim().split('\n');
      healthStatus.recentRequests = lines.map(line => {
        try {
          const parsed = JSON.parse(line);
          return {
            timestamp: parsed.timestamp,
            method: parsed.method,
            path: parsed.path,
            statusCode: parsed.statusCode,
            duration: parsed.duration
          };
        } catch (e) {
          return { message: line };
        }
      });
      
      // Calculate response time metrics if we have enough data
      if (healthStatus.recentRequests.length > 0) {
        const durations = healthStatus.recentRequests
          .filter(req => req.duration)
          .map(req => parseInt(req.duration, 10));
          
        if (durations.length > 0) {
          const sum = durations.reduce((a, b) => a + b, 0);
          const avg = sum / durations.length;
          const max = Math.max(...durations);
          
          // Simple p95 calculation
          const sorted = [...durations].sort((a, b) => a - b);
          const p95Index = Math.floor(sorted.length * 0.95);
          const p95 = sorted[p95Index] || max;
          
          performanceMetrics.responseTime = {
            avg,
            p95,
            max
          };
        }
      }
    } catch (err) {
      logger.error('Error parsing API logs', { error: err });
    }
  });
}

// Run all health checks
async function runAllChecks() {
  try {
    await checkAppHealth();
    await checkWeasyPrintService();
    checkOpenAI();
    checkFirebase();
    checkResend();
    checkSystem();
    checkRecentErrors();
    checkRecentRequests();
  } catch (error) {
    logger.error('Error running health checks', { error });
  }
}

// Generate HTML dashboard
function generateDashboard() {
  const statusStyles = {
    ok: 'background-color: #28a745; color: white;',
    warning: 'background-color: #ffc107; color: black;',
    error: 'background-color: #dc3545; color: white;',
    unknown: 'background-color: #6c757d; color: white;'
  };
  
  const overallStatus = Object.values(healthStatus)
    .filter(item => typeof item === 'object' && item.status)
    .some(item => item.status === 'error') ? 'error' : 
    Object.values(healthStatus)
      .filter(item => typeof item === 'object' && item.status)
      .some(item => item.status === 'warning') ? 'warning' : 'ok';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>SG AI Scorecard - System Monitor</title>
  <meta http-equiv="refresh" content="${REFRESH_INTERVAL}">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .status-indicator {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: bold;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .dashboard-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .card-header {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
    }
    .card-content {
      font-size: 14px;
    }
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
    }
    .metrics-table th, .metrics-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .metrics-table th {
      font-weight: bold;
    }
    .log-entry {
      margin-bottom: 8px;
      padding: 8px;
      background-color: #f8f9fa;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      overflow-x: auto;
    }
    .timestamp {
      color: #6c757d;
      font-size: 12px;
    }
    .progress-bar {
      height: 8px;
      background-color: #e9ecef;
      border-radius: 4px;
      margin-top: 4px;
    }
    .progress-value {
      height: 100%;
      border-radius: 4px;
      background-color: #007bff;
    }
    .warning .progress-value {
      background-color: #ffc107;
    }
    .danger .progress-value {
      background-color: #dc3545;
    }
  </style>
</head>
<body>
  <div class="dashboard-header">
    <h1>SG AI Scorecard - System Monitor</h1>
    <div>
      <span class="status-indicator" style="${statusStyles[overallStatus]}">
        ${overallStatus === 'ok' ? 'All Systems Operational' : 
          overallStatus === 'warning' ? 'Warning: Some Issues Detected' : 
          'Alert: Critical Issues Detected'}
      </span>
    </div>
  </div>
  
  <div class="dashboard-grid">
    <!-- App Status -->
    <div class="dashboard-card">
      <div class="card-header">
        <span>Application Status</span>
        <span class="status-indicator" style="${statusStyles[healthStatus.app.status]}">
          ${healthStatus.app.status.toUpperCase()}
        </span>
      </div>
      <div class="card-content">
        <p>${healthStatus.app.message}</p>
        <p class="timestamp">Last checked: ${healthStatus.app.lastChecked ? healthStatus.app.lastChecked.toISOString() : 'Never'}</p>
      </div>
    </div>
    
    <!-- WeasyPrint Status -->
    <div class="dashboard-card">
      <div class="card-header">
        <span>WeasyPrint Service</span>
        <span class="status-indicator" style="${statusStyles[healthStatus.weasyprint.status]}">
          ${healthStatus.weasyprint.status.toUpperCase()}
        </span>
      </div>
      <div class="card-content">
        <p>${healthStatus.weasyprint.message}</p>
        <p class="timestamp">Last checked: ${healthStatus.weasyprint.lastChecked ? healthStatus.weasyprint.lastChecked.toISOString() : 'Never'}</p>
      </div>
    </div>
    
    <!-- External Services -->
    <div class="dashboard-card">
      <div class="card-header">
        <span>External Services</span>
      </div>
      <div class="card-content">
        <div style="margin-bottom: 12px;">
          <strong>OpenAI API:</strong> 
          <span class="status-indicator" style="${statusStyles[healthStatus.openai.status]}">
            ${healthStatus.openai.status.toUpperCase()}
          </span>
          <p>${healthStatus.openai.message}</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>Firebase:</strong> 
          <span class="status-indicator" style="${statusStyles[healthStatus.firebase.status]}">
            ${healthStatus.firebase.status.toUpperCase()}
          </span>
          <p>${healthStatus.firebase.message}</p>
        </div>
        <div>
          <strong>Resend Email:</strong> 
          <span class="status-indicator" style="${statusStyles[healthStatus.resend.status]}">
            ${healthStatus.resend.status.toUpperCase()}
          </span>
          <p>${healthStatus.resend.message}</p>
        </div>
      </div>
    </div>
    
    <!-- System Resources -->
    <div class="dashboard-card">
      <div class="card-header">
        <span>System Resources</span>
        <span class="status-indicator" style="${statusStyles[healthStatus.system.status]}">
          ${healthStatus.system.status.toUpperCase()}
        </span>
      </div>
      <div class="card-content">
        <div style="margin-bottom: 12px;">
          <strong>Memory Usage:</strong> ${performanceMetrics.memory.used}MB / ${performanceMetrics.memory.total}MB (${performanceMetrics.memory.percentage}%)
          <div class="progress-bar ${performanceMetrics.memory.percentage > 90 ? 'danger' : performanceMetrics.memory.percentage > 70 ? 'warning' : ''}">
            <div class="progress-value" style="width: ${performanceMetrics.memory.percentage}%"></div>
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>CPU Usage:</strong> ${performanceMetrics.cpu.usage.toFixed(1)}%
          <div class="progress-bar ${performanceMetrics.cpu.usage > 90 ? 'danger' : performanceMetrics.cpu.usage > 70 ? 'warning' : ''}">
            <div class="progress-value" style="width: ${performanceMetrics.cpu.usage}%"></div>
          </div>
        </div>
        <div>
          <strong>Disk Space:</strong> ${performanceMetrics.disk.used} / ${performanceMetrics.disk.total} (${performanceMetrics.disk.percentage}%)
          <div class="progress-bar ${performanceMetrics.disk.percentage > 90 ? 'danger' : performanceMetrics.disk.percentage > 70 ? 'warning' : ''}">
            <div class="progress-value" style="width: ${performanceMetrics.disk.percentage}%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Performance Metrics -->
  <div class="dashboard-card">
    <div class="card-header">
      <span>Performance Metrics</span>
    </div>
    <div class="card-content">
      <table class="metrics-table">
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Average Response Time</td>
          <td>${performanceMetrics.responseTime.avg.toFixed(2)}ms</td>
        </tr>
        <tr>
          <td>95th Percentile Response Time</td>
          <td>${performanceMetrics.responseTime.p95.toFixed(2)}ms</td>
        </tr>
        <tr>
          <td>Maximum Response Time</td>
          <td>${performanceMetrics.responseTime.max.toFixed(2)}ms</td>
        </tr>
      </table>
    </div>
  </div>
  
  <!-- Recent Errors -->
  <div class="dashboard-card">
    <div class="card-header">
      <span>Recent Errors</span>
    </div>
    <div class="card-content">
      ${healthStatus.recentErrors.length === 0 ? 
        '<p>No recent errors</p>' : 
        healthStatus.recentErrors.map(error => 
          `<div class="log-entry">
            ${error.timestamp ? `<span class="timestamp">${error.timestamp}</span> ` : ''}
            ${error.message}
          </div>`
        ).join('')
      }
    </div>
  </div>
  
  <!-- Recent Requests -->
  <div class="dashboard-card">
    <div class="card-header">
      <span>Recent Requests</span>
    </div>
    <div class="card-content">
      ${healthStatus.recentRequests.length === 0 ? 
        '<p>No recent requests</p>' : 
        `<table class="metrics-table">
          <tr>
            <th>Time</th>
            <th>Method</th>
            <th>Path</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
          ${healthStatus.recentRequests.map(req => 
            `<tr>
              <td>${req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : 'N/A'}</td>
              <td>${req.method || 'N/A'}</td>
              <td>${req.path || 'N/A'}</td>
              <td>${req.statusCode || 'N/A'}</td>
              <td>${req.duration || 'N/A'}</td>
            </tr>`
          ).join('')}
        </table>`
      }
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px;">
    Last updated: ${new Date().toISOString()} • Auto-refreshes every ${REFRESH_INTERVAL} seconds
  </div>
</body>
</html>
  `;
}

// Start HTTP server for dashboard
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(generateDashboard());
});

// Run initial health checks
runAllChecks();

// Schedule regular health checks
setInterval(runAllChecks, REFRESH_INTERVAL * 1000);

// Start server
server.listen(PORT, () => {
  logger.info(`Monitoring dashboard running at http://localhost:${PORT}`);
}); 