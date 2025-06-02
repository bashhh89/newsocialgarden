#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * This script performs basic security checks on the application and its dependencies.
 * It is meant to complement, not replace, comprehensive security audits.
 * 
 * Usage:
 *   node scripts/security-audit.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// Configuration
const APP_PORT = process.env.PORT || 3006;
const APP_HOST = 'localhost';
const PROJECT_ROOT = path.join(__dirname, '..');
const SECURITY_REPORT_PATH = path.join(PROJECT_ROOT, 'logs/security-audit.json');

// Ensure logs directory exists
const logDir = path.dirname(SECURITY_REPORT_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Main security issues collection
const securityIssues = {
  timestamp: new Date().toISOString(),
  summary: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0
  },
  vulnerabilities: [],
  config: {
    env: {},
    headers: {},
    dependencies: {}
  }
};

// Helper function for HTTP requests
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
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
    
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Add a vulnerability to the report
function addVulnerability(title, description, severity, category, remediation, evidence = null) {
  const levels = ['critical', 'high', 'medium', 'low', 'info'];
  if (!levels.includes(severity)) {
    severity = 'info';
  }
  
  securityIssues.vulnerabilities.push({
    title,
    description,
    severity,
    category,
    remediation,
    evidence
  });
  
  securityIssues.summary[severity]++;
  securityIssues.summary.total++;
  
  // Log to console
  const severityColors = {
    critical: '\x1b[31m', // Red
    high: '\x1b[31m', // Red
    medium: '\x1b[33m', // Yellow
    low: '\x1b[36m', // Cyan
    info: '\x1b[37m' // White
  };
  
  console.log(`${severityColors[severity]}[${severity.toUpperCase()}]\x1b[0m ${title}`);
  if (evidence) {
    console.log(`  Evidence: ${evidence}`);
  }
}

// Check npm audit for vulnerable dependencies
async function checkNpmAudit() {
  console.log('\n=== Checking for vulnerable dependencies ===');
  
  try {
    // Run npm audit to check for vulnerable dependencies
    const output = execSync('npm audit --json', { 
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString();
    
    try {
      const auditResult = JSON.parse(output);
      
      // Add each vulnerability to the report
      if (auditResult.vulnerabilities) {
        for (const [name, details] of Object.entries(auditResult.vulnerabilities)) {
          if (details.severity && details.via) {
            const evidence = Array.isArray(details.via) 
              ? details.via.map(v => typeof v === 'string' ? v : v.title).join(', ')
              : typeof details.via === 'string' ? details.via : details.via.title;
              
            addVulnerability(
              `Vulnerable dependency: ${name}`,
              `The package ${name}@${details.version} has known security issues.`,
              details.severity,
              'dependencies',
              `Update to version ${details.recommendedVersion || 'latest'} or higher.`,
              evidence
            );
          }
        }
      }
      
      // Store metadata
      securityIssues.config.dependencies = {
        totalDependencies: auditResult.metadata?.totalDependencies || 0,
        vulnerableDependencies: auditResult.metadata?.vulnerabilities || {}
      };
    } catch (parseError) {
      addVulnerability(
        'Error parsing npm audit output',
        'Failed to parse the output of npm audit',
        'low',
        'dependencies',
        'Run npm audit manually to check for vulnerable dependencies.'
      );
    }
  } catch (error) {
    addVulnerability(
      'Error running npm audit',
      'Failed to run npm audit to check for vulnerable dependencies',
      'medium',
      'dependencies',
      'Run npm audit manually to check for vulnerable dependencies.',
      error.message
    );
  }
}

// Check HTTP security headers
async function checkSecurityHeaders() {
  console.log('\n=== Checking HTTP security headers ===');
  
  try {
    const response = await httpRequest(`http://${APP_HOST}:${APP_PORT}/`);
    const headers = response.headers;
    
    // Store headers for reference
    securityIssues.config.headers = headers;
    
    // Check Content-Security-Policy
    if (!headers['content-security-policy']) {
      addVulnerability(
        'Missing Content-Security-Policy header',
        'The application does not have a Content-Security-Policy header, which helps prevent XSS and other code injection attacks.',
        'high',
        'headers',
        'Add a Content-Security-Policy header with appropriate directives.'
      );
    }
    
    // Check X-Content-Type-Options
    if (!headers['x-content-type-options']) {
      addVulnerability(
        'Missing X-Content-Type-Options header',
        'The application does not have an X-Content-Type-Options header, which prevents MIME type sniffing.',
        'medium',
        'headers',
        'Add the header "X-Content-Type-Options: nosniff".'
      );
    }
    
    // Check X-Frame-Options
    if (!headers['x-frame-options']) {
      addVulnerability(
        'Missing X-Frame-Options header',
        'The application does not have an X-Frame-Options header, which prevents clickjacking attacks.',
        'medium',
        'headers',
        'Add the header "X-Frame-Options: DENY" or "X-Frame-Options: SAMEORIGIN".'
      );
    }
    
    // Check Strict-Transport-Security
    if (!headers['strict-transport-security']) {
      addVulnerability(
        'Missing Strict-Transport-Security header',
        'The application does not have a Strict-Transport-Security header, which enforces HTTPS connections.',
        'medium',
        'headers',
        'Add the header "Strict-Transport-Security: max-age=31536000; includeSubDomains".'
      );
    }
    
    // Check Referrer-Policy
    if (!headers['referrer-policy']) {
      addVulnerability(
        'Missing Referrer-Policy header',
        'The application does not have a Referrer-Policy header, which controls what information is sent in the Referer header.',
        'low',
        'headers',
        'Add the header "Referrer-Policy: no-referrer-when-downgrade" or stricter.'
      );
    }
    
    // Check Permissions-Policy
    if (!headers['permissions-policy'] && !headers['feature-policy']) {
      addVulnerability(
        'Missing Permissions-Policy header',
        'The application does not have a Permissions-Policy header, which controls which browser features the application can use.',
        'low',
        'headers',
        'Add a Permissions-Policy header with appropriate restrictions.'
      );
    }
  } catch (error) {
    addVulnerability(
      'Error checking HTTP headers',
      'Failed to connect to the application to check HTTP headers',
      'medium',
      'headers',
      'Ensure the application is running and accessible.',
      error.message
    );
  }
}

// Check for sensitive files exposed in public directories
function checkSensitiveFiles() {
  console.log('\n=== Checking for sensitive files exposed in public directories ===');
  
  const publicDir = path.join(PROJECT_ROOT, 'public');
  const sensitivePatterns = [
    /\.env.*/i,
    /config.*\.json/i,
    /.*secret.*/i,
    /.*password.*/i,
    /.*credential.*/i,
    /.*\.key$/i,
    /.*\.pem$/i
  ];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        scanDirectory(itemPath);
      } else if (stats.isFile()) {
        // Check if filename matches any sensitive pattern
        if (sensitivePatterns.some(pattern => pattern.test(item))) {
          addVulnerability(
            'Potentially sensitive file in public directory',
            `The file "${itemPath.replace(PROJECT_ROOT, '')}" may contain sensitive information and is publicly accessible.`,
            'high',
            'configuration',
            'Remove sensitive files from public directories or restrict access to them.',
            itemPath
          );
        }
      }
    });
  }
  
  try {
    scanDirectory(publicDir);
  } catch (error) {
    addVulnerability(
      'Error scanning public directory',
      'Failed to scan public directory for sensitive files',
      'low',
      'configuration',
      'Manually check public directories for sensitive files.',
      error.message
    );
  }
}

// Check environment variables for potential issues
function checkEnvironmentVariables() {
  console.log('\n=== Checking environment variables ===');
  
  // List of environment variables that should not be empty
  const criticalEnvVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'RESEND_API_KEY'
  ];
  
  // Store environment variables (without values) for the report
  Object.keys(process.env).forEach(key => {
    if (key.includes('API_KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
      securityIssues.config.env[key] = '[REDACTED]';
    } else {
      securityIssues.config.env[key] = process.env[key];
    }
  });
  
  // Check for missing critical environment variables
  criticalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      addVulnerability(
        `Missing critical environment variable: ${envVar}`,
        `The environment variable ${envVar} is not set, which may affect application functionality.`,
        'medium',
        'configuration',
        `Set the ${envVar} environment variable in production.`
      );
    }
  });
  
  // Check for exposed secrets in client-side code
  const clientSideEnvVars = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'));
  
  clientSideEnvVars.forEach(envVar => {
    if (envVar.includes('SECRET') || envVar.includes('PRIVATE') || envVar.includes('PASSWORD')) {
      addVulnerability(
        `Potentially exposed secret: ${envVar}`,
        `The environment variable ${envVar} is prefixed with NEXT_PUBLIC_, which makes it available to the client.`,
        'critical',
        'configuration',
        `Rename the environment variable to remove the NEXT_PUBLIC_ prefix and access it only on the server.`
      );
    }
  });
}

// Check for outdated dependencies
function checkOutdatedDependencies() {
  console.log('\n=== Checking for outdated dependencies ===');
  
  try {
    // Run npm outdated to check for outdated dependencies
    const output = execSync('npm outdated --json', { 
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString();
    
    try {
      const outdatedDeps = JSON.parse(output);
      const outdatedCount = Object.keys(outdatedDeps).length;
      
      if (outdatedCount > 0) {
        // Add vulnerability for significantly outdated packages
        const criticallyOutdated = [];
        
        Object.entries(outdatedDeps).forEach(([name, info]) => {
          // Check if package is significantly outdated (major version)
          const current = info.current.split('.')[0];
          const latest = info.latest.split('.')[0];
          
          if (parseInt(latest) - parseInt(current) >= 2) {
            criticallyOutdated.push(`${name} (${info.current} → ${info.latest})`);
          }
        });
        
        if (criticallyOutdated.length > 0) {
          addVulnerability(
            'Critically outdated dependencies',
            'The application has dependencies that are multiple major versions behind the latest release.',
            'high',
            'dependencies',
            'Update the outdated dependencies to their latest versions.',
            criticallyOutdated.join(', ')
          );
        } else {
          addVulnerability(
            'Outdated dependencies',
            `The application has ${outdatedCount} outdated dependencies.`,
            'low',
            'dependencies',
            'Update the outdated dependencies to their latest versions.',
            `${outdatedCount} outdated packages`
          );
        }
      }
    } catch (parseError) {
      // If output is empty, there are no outdated dependencies
      if (output.trim() === '') {
        console.log('  All dependencies are up to date.');
      } else {
        addVulnerability(
          'Error parsing npm outdated output',
          'Failed to parse the output of npm outdated',
          'low',
          'dependencies',
          'Run npm outdated manually to check for outdated dependencies.'
        );
      }
    }
  } catch (error) {
    // If the command fails but returns JSON, process it
    try {
      const errorOutput = error.stdout.toString();
      const outdatedDeps = JSON.parse(errorOutput);
      const outdatedCount = Object.keys(outdatedDeps).length;
      
      if (outdatedCount > 0) {
        addVulnerability(
          'Outdated dependencies',
          `The application has ${outdatedCount} outdated dependencies.`,
          'low',
          'dependencies',
          'Update the outdated dependencies to their latest versions.',
          `${outdatedCount} outdated packages`
        );
      }
    } catch (e) {
      addVulnerability(
        'Error checking outdated dependencies',
        'Failed to run npm outdated to check for outdated dependencies',
        'low',
        'dependencies',
        'Run npm outdated manually to check for outdated dependencies.',
        error.message
      );
    }
  }
}

// Run all security checks
async function runSecurityChecks() {
  console.log('=== Starting Security Audit ===');
  console.log(`Timestamp: ${securityIssues.timestamp}`);
  
  // Run all checks
  await checkSecurityHeaders();
  await checkNpmAudit();
  checkSensitiveFiles();
  checkEnvironmentVariables();
  checkOutdatedDependencies();
  
  // Print summary
  console.log('\n=== Security Audit Summary ===');
  console.log(`Critical: ${securityIssues.summary.critical}`);
  console.log(`High: ${securityIssues.summary.high}`);
  console.log(`Medium: ${securityIssues.summary.medium}`);
  console.log(`Low: ${securityIssues.summary.low}`);
  console.log(`Info: ${securityIssues.summary.info}`);
  console.log(`Total: ${securityIssues.summary.total}`);
  
  // Save report to file
  try {
    fs.writeFileSync(SECURITY_REPORT_PATH, JSON.stringify(securityIssues, null, 2));
    console.log(`\nSecurity report saved to: ${SECURITY_REPORT_PATH}`);
  } catch (error) {
    console.error(`Error saving security report: ${error.message}`);
  }
  
  // Return exit code based on severity of issues
  if (securityIssues.summary.critical > 0) {
    console.log('\n⚠️ CRITICAL security issues found! Immediate action required.');
    return 2;
  } else if (securityIssues.summary.high > 0) {
    console.log('\n⚠️ HIGH security issues found! Action required.');
    return 1;
  } else {
    console.log('\n✅ No critical or high security issues found.');
    return 0;
  }
}

// Run the security checks
runSecurityChecks()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running security audit:', error);
    process.exit(3);
  }); 