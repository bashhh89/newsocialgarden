#!/usr/bin/env node

/**
 * API Key Management Script
 * 
 * This script helps manage API keys securely, including rotation schedules
 * and monitoring usage. It's designed to enhance security by implementing
 * key rotation best practices.
 * 
 * Usage:
 *   node scripts/api-key-management.js [command]
 * 
 * Commands:
 *   status            Check status of all API keys
 *   rotate [service]  Prepare rotation for a specific service
 *   monitor           Start monitoring API key usage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { logger } = require('./setup-logging');

// Configuration
const CONFIG_FILE = path.join(__dirname, '../config/api-keys.json');
const KEY_HISTORY_FILE = path.join(__dirname, '../logs/api-key-history.json');
const ROTATION_REMINDER_DAYS = 90; // Remind to rotate keys after 90 days

// Service configurations
const SUPPORTED_SERVICES = {
  openai: {
    name: 'OpenAI',
    envVarName: 'OPENAI_API_KEY',
    instructionsUrl: 'https://platform.openai.com/api-keys',
    rotationSteps: [
      '1. Log in to the OpenAI dashboard',
      '2. Create a new API key',
      '3. Update the .env.local file with the new key',
      '4. Verify the new key works correctly',
      '5. Delete the old API key from the OpenAI dashboard'
    ]
  },
  firebase: {
    name: 'Firebase',
    envVarName: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    instructionsUrl: 'https://console.firebase.google.com/project/_/settings/general/',
    rotationSteps: [
      '1. Log in to the Firebase console',
      '2. Go to Project settings',
      '3. Create a new Web API key',
      '4. Update the .env.local file with the new key',
      '5. Verify the new key works correctly',
      '6. Delete the old API key from the Firebase console'
    ]
  },
  resend: {
    name: 'Resend',
    envVarName: 'RESEND_API_KEY',
    instructionsUrl: 'https://resend.com/api-keys',
    rotationSteps: [
      '1. Log in to the Resend dashboard',
      '2. Generate a new API key',
      '3. Update the .env.local file with the new key',
      '4. Verify the new key works correctly',
      '5. Delete the old API key from the Resend dashboard'
    ]
  }
};

// Create necessary directories
const configDir = path.dirname(CONFIG_FILE);
const logDir = path.dirname(KEY_HISTORY_FILE);

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Helper function to safely load JSON file
function loadJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
  }
  return defaultValue;
}

// Helper function to safely save JSON file
function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    return false;
  }
}

// Get API key fingerprint (a hash of the key for tracking without exposing it)
function getKeyFingerprint(key) {
  if (!key) return 'none';
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
}

// Check environment variables and update configuration
function checkApiKeys() {
  const config = loadJsonFile(CONFIG_FILE);
  const keyHistory = loadJsonFile(KEY_HISTORY_FILE, { keys: {} });
  let updated = false;
  
  // Initialize key history if it doesn't exist
  if (!keyHistory.keys) {
    keyHistory.keys = {};
  }
  
  // Process each service
  Object.entries(SUPPORTED_SERVICES).forEach(([serviceId, service]) => {
    const envVarName = service.envVarName;
    const currentKey = process.env[envVarName];
    const keyFingerprint = getKeyFingerprint(currentKey);
    
    // Initialize service in config if needed
    if (!config[serviceId]) {
      config[serviceId] = {
        lastRotated: null,
        fingerprint: null,
        status: 'unknown'
      };
    }
    
    // Check if key exists
    if (!currentKey) {
      config[serviceId].status = 'missing';
      updated = true;
    } else {
      // Check if key has changed since last check
      if (config[serviceId].fingerprint && config[serviceId].fingerprint !== keyFingerprint) {
        // Key has been rotated
        const oldFingerprint = config[serviceId].fingerprint;
        config[serviceId].lastRotated = new Date().toISOString();
        
        // Record key rotation in history
        if (!keyHistory.keys[serviceId]) {
          keyHistory.keys[serviceId] = [];
        }
        
        keyHistory.keys[serviceId].push({
          oldFingerprint,
          newFingerprint: keyFingerprint,
          rotatedAt: config[serviceId].lastRotated
        });
        
        console.log(`[INFO] Detected key rotation for ${service.name}`);
      }
      
      // Update fingerprint and status
      config[serviceId].fingerprint = keyFingerprint;
      config[serviceId].status = 'active';
      updated = true;
      
      // Check rotation date
      if (config[serviceId].lastRotated) {
        const lastRotated = new Date(config[serviceId].lastRotated);
        const daysSinceRotation = Math.floor((new Date() - lastRotated) / (1000 * 60 * 60 * 24));
        
        if (daysSinceRotation > ROTATION_REMINDER_DAYS) {
          config[serviceId].status = 'rotation-needed';
          console.log(`[WARNING] ${service.name} API key has not been rotated in ${daysSinceRotation} days`);
        }
      } else {
        // No rotation date recorded
        config[serviceId].status = 'needs-initial-rotation-date';
      }
    }
  });
  
  // Save updated config
  if (updated) {
    saveJsonFile(CONFIG_FILE, config);
    saveJsonFile(KEY_HISTORY_FILE, keyHistory);
  }
  
  return config;
}

// Display API key status
function showStatus() {
  const config = checkApiKeys();
  
  console.log('\n=== API Key Status ===');
  
  Object.entries(SUPPORTED_SERVICES).forEach(([serviceId, service]) => {
    const serviceConfig = config[serviceId] || { status: 'unknown', lastRotated: null };
    const statusColors = {
      'active': '\x1b[32m', // Green
      'missing': '\x1b[31m', // Red
      'rotation-needed': '\x1b[33m', // Yellow
      'unknown': '\x1b[37m', // White
      'needs-initial-rotation-date': '\x1b[36m' // Cyan
    };
    
    const statusText = {
      'active': 'Active',
      'missing': 'Missing',
      'rotation-needed': 'Rotation Needed',
      'unknown': 'Unknown',
      'needs-initial-rotation-date': 'Active (Set Rotation Date)'
    };
    
    const statusColor = statusColors[serviceConfig.status] || statusColors.unknown;
    const status = statusText[serviceConfig.status] || 'Unknown';
    
    let lastRotated = 'Never';
    let daysAgo = '';
    
    if (serviceConfig.lastRotated) {
      const rotationDate = new Date(serviceConfig.lastRotated);
      lastRotated = rotationDate.toLocaleDateString();
      const daysSinceRotation = Math.floor((new Date() - rotationDate) / (1000 * 60 * 60 * 24));
      daysAgo = `(${daysSinceRotation} days ago)`;
    }
    
    console.log(`${service.name} API Key:`);
    console.log(`  Status: ${statusColor}${status}\x1b[0m`);
    console.log(`  Last Rotated: ${lastRotated} ${daysAgo}`);
    console.log(`  Fingerprint: ${serviceConfig.fingerprint || 'N/A'}`);
    console.log('');
  });
}

// Prepare for key rotation
function rotateKey(serviceId) {
  if (!SUPPORTED_SERVICES[serviceId]) {
    console.error(`Error: Unsupported service '${serviceId}'`);
    console.log(`Supported services: ${Object.keys(SUPPORTED_SERVICES).join(', ')}`);
    return;
  }
  
  const service = SUPPORTED_SERVICES[serviceId];
  const config = checkApiKeys();
  const serviceConfig = config[serviceId] || { status: 'unknown' };
  
  console.log(`\n=== Rotating ${service.name} API Key ===`);
  console.log(`Current Status: ${serviceConfig.status}`);
  console.log(`Current Fingerprint: ${serviceConfig.fingerprint || 'N/A'}`);
  console.log(`Last Rotated: ${serviceConfig.lastRotated || 'Never'}`);
  
  console.log('\nRotation Steps:');
  service.rotationSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  
  console.log(`\nMore Information: ${service.instructionsUrl}`);
  
  // Prompt to record rotation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nHave you completed the rotation? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      // Update rotation date
      config[serviceId].lastRotated = new Date().toISOString();
      
      // Check if the key has actually changed
      const newKey = process.env[service.envVarName];
      const newFingerprint = getKeyFingerprint(newKey);
      
      if (newFingerprint === serviceConfig.fingerprint) {
        console.log('\n[WARNING] The API key fingerprint has not changed. The key may not have been rotated.');
        rl.question('Do you want to record the rotation anyway? (yes/no): ', (confirm) => {
          if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
            config[serviceId].fingerprint = newFingerprint;
            saveJsonFile(CONFIG_FILE, config);
            console.log('[INFO] Rotation recorded.');
          } else {
            console.log('[INFO] Rotation not recorded.');
          }
          rl.close();
        });
      } else {
        // Key has changed
        const keyHistory = loadJsonFile(KEY_HISTORY_FILE, { keys: {} });
        
        if (!keyHistory.keys[serviceId]) {
          keyHistory.keys[serviceId] = [];
        }
        
        keyHistory.keys[serviceId].push({
          oldFingerprint: serviceConfig.fingerprint || 'unknown',
          newFingerprint: newFingerprint,
          rotatedAt: config[serviceId].lastRotated
        });
        
        config[serviceId].fingerprint = newFingerprint;
        config[serviceId].status = 'active';
        
        saveJsonFile(CONFIG_FILE, config);
        saveJsonFile(KEY_HISTORY_FILE, keyHistory);
        
        console.log('[INFO] Rotation recorded successfully.');
        rl.close();
      }
    } else {
      console.log('[INFO] Rotation not recorded.');
      rl.close();
    }
  });
}

// Start API key usage monitoring
function monitorApiKeys() {
  console.log('\n=== API Key Usage Monitoring ===');
  console.log('Monitoring has started. Press Ctrl+C to stop.');
  
  // Set up interval to check keys
  const intervalId = setInterval(() => {
    const config = checkApiKeys();
    const now = new Date().toISOString();
    
    Object.entries(SUPPORTED_SERVICES).forEach(([serviceId, service]) => {
      const serviceConfig = config[serviceId] || { status: 'unknown' };
      
      if (serviceConfig.status === 'rotation-needed') {
        logger.warn(`API key rotation needed for ${service.name}`, {
          service: serviceId,
          lastRotated: serviceConfig.lastRotated,
          fingerprint: serviceConfig.fingerprint
        });
      }
      
      if (serviceConfig.status === 'missing') {
        logger.error(`Missing API key for ${service.name}`, {
          service: serviceId
        });
      }
    });
  }, 60 * 60 * 1000); // Check every hour
  
  // Handle exit
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log('\nMonitoring stopped.');
    process.exit(0);
  });
}

// Set initial rotation date for API key
function setInitialRotationDate(serviceId) {
  if (!SUPPORTED_SERVICES[serviceId]) {
    console.error(`Error: Unsupported service '${serviceId}'`);
    console.log(`Supported services: ${Object.keys(SUPPORTED_SERVICES).join(', ')}`);
    return;
  }
  
  const service = SUPPORTED_SERVICES[serviceId];
  const config = checkApiKeys();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(`\n=== Set Initial Rotation Date for ${service.name} API Key ===`);
  
  // Default to today if no date is provided
  const today = new Date().toISOString().split('T')[0];
  
  rl.question(`Enter the date of the last rotation (YYYY-MM-DD) [${today}]: `, (answer) => {
    let rotationDate = today;
    
    if (answer && answer.trim()) {
      // Validate date format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(answer)) {
        rotationDate = answer;
      } else {
        console.log(`[WARNING] Invalid date format. Using today's date (${today}).`);
      }
    }
    
    // Update configuration
    config[serviceId].lastRotated = new Date(rotationDate).toISOString();
    config[serviceId].status = 'active';
    
    saveJsonFile(CONFIG_FILE, config);
    
    console.log(`[INFO] Initial rotation date set to ${rotationDate} for ${service.name} API key.`);
    rl.close();
  });
}

// Show rotation history
function showRotationHistory() {
  const keyHistory = loadJsonFile(KEY_HISTORY_FILE, { keys: {} });
  
  console.log('\n=== API Key Rotation History ===');
  
  let historyFound = false;
  
  Object.entries(SUPPORTED_SERVICES).forEach(([serviceId, service]) => {
    const serviceHistory = keyHistory.keys[serviceId] || [];
    
    if (serviceHistory.length > 0) {
      historyFound = true;
      console.log(`\n${service.name} API Key:`);
      
      serviceHistory.forEach((rotation, index) => {
        const date = new Date(rotation.rotatedAt).toLocaleDateString();
        console.log(`  ${index + 1}. ${date}: ${rotation.oldFingerprint} → ${rotation.newFingerprint}`);
      });
    }
  });
  
  if (!historyFound) {
    console.log('No rotation history found for any service.');
  }
}

// Print usage information
function showUsage() {
  console.log('\nUsage: node api-key-management.js [command]');
  console.log('\nCommands:');
  console.log('  status                        Check status of all API keys');
  console.log('  rotate <service>              Prepare rotation for a specific service');
  console.log('  set-date <service>            Set initial rotation date for a service');
  console.log('  history                       Show API key rotation history');
  console.log('  monitor                       Start monitoring API key usage');
  console.log('\nSupported services:');
  
  Object.entries(SUPPORTED_SERVICES).forEach(([serviceId, service]) => {
    console.log(`  ${serviceId.padEnd(10)} ${service.name}`);
  });
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showUsage();
    return;
  }
  
  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'rotate':
      const serviceToRotate = args[1];
      if (!serviceToRotate) {
        console.error('Error: Service name required');
        showUsage();
        return;
      }
      rotateKey(serviceToRotate);
      break;
    case 'set-date':
      const serviceToSetDate = args[1];
      if (!serviceToSetDate) {
        console.error('Error: Service name required');
        showUsage();
        return;
      }
      setInitialRotationDate(serviceToSetDate);
      break;
    case 'history':
      showRotationHistory();
      break;
    case 'monitor':
      monitorApiKeys();
      break;
    default:
      console.error(`Error: Unknown command '${command}'`);
      showUsage();
  }
}

// Run the script
main(); 