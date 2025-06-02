#!/usr/bin/env node

/**
 * Load Testing Script
 * 
 * This script performs basic load testing on the application by simulating
 * multiple concurrent users making requests.
 * 
 * Usage:
 *   node scripts/load-test.js [options]
 * 
 * Options:
 *   --duration=<seconds>   Test duration in seconds (default: 60)
 *   --users=<number>       Number of concurrent users (default: 10)
 *   --url=<url>            Target URL (default: http://localhost:3006)
 *   --rampup=<seconds>     Ramp-up period in seconds (default: 10)
 *   --scenario=<name>      Test scenario (default: basic, options: basic, pdf, api)
 *   --verbose              Show detailed output
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

// Configuration
const config = {
  duration: parseInt(args.duration || 60, 10),
  users: parseInt(args.users || 10, 10),
  url: args.url || 'http://localhost:3006',
  rampup: parseInt(args.rampup || 10, 10),
  scenario: args.scenario || 'basic',
  verbose: args.verbose || false
};

// Scenarios
const scenarios = {
  basic: [
    { path: '/', method: 'GET', weight: 40 },
    { path: '/learning-hub', method: 'GET', weight: 20 },
    { path: '/scorecard/results', method: 'GET', weight: 30 },
    { path: '/landing', method: 'GET', weight: 10 }
  ],
  pdf: [
    { path: '/api/generate-scorecard-weasyprint-report', method: 'POST', weight: 60, 
      body: { reportId: 'Aa4kIrBYpxsIo1MO6S2a' } },
    { path: '/api/generate-pdf', method: 'POST', weight: 40,
      body: { reportId: 'Aa4kIrBYpxsIo1MO6S2a', format: 'pdf' } }
  ],
  api: [
    { path: '/api/scorecard-ai/get-report', method: 'POST', weight: 70, 
      body: { questions: {}, userId: 'loadtest', email: 'loadtest@example.com' } },
    { path: '/api/learning-hub/templates', method: 'GET', weight: 30 }
  ]
};

// Results storage
const results = {
  total: 0,
  success: 0,
  failed: 0,
  statusCodes: {},
  responseTime: {
    min: Number.MAX_SAFE_INTEGER,
    max: 0,
    avg: 0,
    p95: 0,
    values: []
  }
};

// Start a worker for each simulated user
function startWorkers() {
  if (!isMainThread) {
    return;
  }

  const events = new EventEmitter();
  const workers = [];
  const selectedScenario = scenarios[config.scenario] || scenarios.basic;
  const startTime = Date.now();
  let testsCompleted = 0;
  
  // Record start time and print initial info
  console.log(`\n=== Load Test Started ===`);
  console.log(`Scenario: ${config.scenario}`);
  console.log(`Target: ${config.url}`);
  console.log(`Users: ${config.users}`);
  console.log(`Duration: ${config.duration} seconds`);
  console.log(`Ramp-up: ${config.rampup} seconds`);
  console.log(`\nStarting ${config.users} virtual users...`);
  
  // Listen for worker result events
  events.on('result', (data) => {
    results.total++;
    if (data.success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    // Update status code counts
    const statusCode = data.statusCode || 'unknown';
    results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
    
    // Update response time stats
    if (data.responseTime) {
      results.responseTime.values.push(data.responseTime);
      results.responseTime.min = Math.min(results.responseTime.min, data.responseTime);
      results.responseTime.max = Math.max(results.responseTime.max, data.responseTime);
      
      // Recalculate average
      const sum = results.responseTime.values.reduce((a, b) => a + b, 0);
      results.responseTime.avg = sum / results.responseTime.values.length;
    }
    
    // Print progress
    testsCompleted++;
    if (testsCompleted % 10 === 0 || config.verbose) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const successRate = (results.success / results.total * 100).toFixed(2);
      process.stdout.write(`\rProgress: ${elapsed}s | Requests: ${results.total} | Success: ${successRate}%`);
    }
  });
  
  // Create and start worker for each user
  for (let i = 0; i < config.users; i++) {
    // Calculate start delay for each user based on ramp-up period
    const startDelay = Math.floor(i * (config.rampup * 1000 / config.users));
    
    setTimeout(() => {
      const worker = new Worker(__filename, {
        workerData: {
          userId: i + 1,
          scenario: selectedScenario,
          url: config.url,
          duration: config.duration,
          verbose: config.verbose
        }
      });
      
      worker.on('message', (message) => {
        if (message.type === 'result') {
          events.emit('result', message.data);
        }
      });
      
      worker.on('error', (error) => {
        console.error(`Worker ${i + 1} error:`, error);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${i + 1} exited with code ${code}`);
        }
        
        // When all workers are done, print final results
        const activeWorkers = workers.filter(w => !w.exited);
        if (activeWorkers.length === 0) {
          printResults();
        }
      });
      
      workers.push(worker);
      
      if (config.verbose) {
        console.log(`Started user ${i + 1}`);
      }
    }, startDelay);
  }
  
  // End test after duration + ramp-up time
  setTimeout(() => {
    console.log('\n\nTest complete. Waiting for pending requests to finish...');
    
    // Give an extra 5 seconds for pending requests to finish
    setTimeout(() => {
      workers.forEach(worker => worker.terminate());
      printResults();
    }, 5000);
  }, (config.duration + config.rampup) * 1000);
  
  // Print final results
  function printResults() {
    // Skip if already printed
    if (results.printed) {
      return;
    }
    results.printed = true;
    
    // Calculate p95
    if (results.responseTime.values.length > 0) {
      const sorted = [...results.responseTime.values].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      results.responseTime.p95 = sorted[p95Index];
    }
    
    console.log('\n\n=== Load Test Results ===');
    console.log(`\nTotal Requests: ${results.total}`);
    console.log(`Successful Requests: ${results.success} (${(results.success / results.total * 100).toFixed(2)}%)`);
    console.log(`Failed Requests: ${results.failed} (${(results.failed / results.total * 100).toFixed(2)}%)`);
    
    console.log('\nResponse Status Codes:');
    Object.entries(results.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count} (${(count / results.total * 100).toFixed(2)}%)`);
    });
    
    console.log('\nResponse Time:');
    console.log(`  Min: ${results.responseTime.min.toFixed(2)}ms`);
    console.log(`  Max: ${results.responseTime.max.toFixed(2)}ms`);
    console.log(`  Avg: ${results.responseTime.avg.toFixed(2)}ms`);
    console.log(`  P95: ${results.responseTime.p95.toFixed(2)}ms`);
    
    console.log(`\nRequests Per Second: ${(results.total / config.duration).toFixed(2)}`);
    
    // Save results to file
    const resultsFile = path.join(__dirname, '../logs/load-test-results.json');
    try {
      // Ensure directory exists
      const dir = path.dirname(resultsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Add metadata to results
      const finalResults = {
        ...results,
        config,
        timestamp: new Date().toISOString()
      };
      
      // Remove large arrays from saved results
      delete finalResults.responseTime.values;
      
      fs.writeFileSync(resultsFile, JSON.stringify(finalResults, null, 2));
      console.log(`\nResults saved to: ${resultsFile}`);
    } catch (error) {
      console.error(`Error saving results: ${error.message}`);
    }
  }
}

// Worker thread function - simulates a single user
function runWorker() {
  const { userId, scenario, url, duration, verbose } = workerData;
  const endTime = Date.now() + (duration * 1000);
  
  // Send result back to main thread
  function sendResult(result) {
    parentPort.postMessage({
      type: 'result',
      data: {
        userId,
        ...result
      }
    });
  }
  
  // Make HTTP request
  function makeRequest(requestConfig) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const parsedUrl = new URL(requestConfig.path, url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        method: requestConfig.method,
        headers: {
          'User-Agent': `LoadTestBot/${userId}`,
          'Accept': 'application/json, text/html',
          'Content-Type': 'application/json'
        }
      };
      
      const req = client.request(parsedUrl, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const success = res.statusCode >= 200 && res.statusCode < 400;
          
          resolve({
            success,
            statusCode: res.statusCode,
            responseTime,
            data: data.substring(0, 100) // Only save the first 100 chars to avoid memory issues
          });
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          error: error.message,
          responseTime
        });
      });
      
      // Add timeout
      req.setTimeout(30000, () => {
        req.abort();
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime
        });
      });
      
      // Add body if method is not GET
      if (requestConfig.method !== 'GET' && requestConfig.body) {
        req.write(JSON.stringify(requestConfig.body));
      }
      
      req.end();
    });
  }
  
  // Select a request based on scenario weights
  function selectRequest() {
    const totalWeight = scenario.reduce((sum, req) => sum + req.weight, 0);
    const random = Math.random() * totalWeight;
    
    let weightSum = 0;
    for (const req of scenario) {
      weightSum += req.weight;
      if (random <= weightSum) {
        return req;
      }
    }
    
    return scenario[0]; // Fallback
  }
  
  // Run requests until duration is reached
  async function runRequests() {
    while (Date.now() < endTime) {
      const requestConfig = selectRequest();
      const result = await makeRequest(requestConfig);
      sendResult(result);
      
      // Small delay between requests (50-200ms) to simulate realistic user behavior
      const delay = 50 + Math.random() * 150;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Start making requests
  runRequests();
}

// Run as main thread or worker
if (isMainThread) {
  startWorkers();
} else {
  runWorker();
} 