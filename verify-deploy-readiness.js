/**
 * Pre-Deployment Verification Script
 * 
 * This script performs a series of checks to ensure the application is ready for production deployment.
 * It verifies:
 * 1. Environment variables are properly set
 * 2. Build artifacts are present and correctly structured
 * 3. Firebase configuration is valid
 * 4. Required port is available
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

console.log(`${colors.blue}${colors.bold}=====================================================${colors.reset}`);
console.log(`${colors.blue}${colors.bold}      PRODUCTION DEPLOYMENT READINESS VERIFICATION    ${colors.reset}`);
console.log(`${colors.blue}${colors.bold}=====================================================${colors.reset}\n`);

// Track overall verification status
let allChecksPass = true;
const issues = [];

// Check Node.js version
console.log(`${colors.bold}1. Checking Node.js version...${colors.reset}`);
try {
  const nodeVersion = execSync('node -v').toString().trim();
  const versionNumber = nodeVersion.replace('v', '').split('.');
  const isValid = Number(versionNumber[0]) >= 18 || (Number(versionNumber[0]) === 18 && Number(versionNumber[1]) >= 17);
  
  if (isValid) {
    console.log(`${colors.green}✓ Node.js version ${nodeVersion} meets requirements${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Node.js version ${nodeVersion} does not meet minimum requirement (18.17.0+)${colors.reset}`);
    allChecksPass = false;
    issues.push(`Node.js version ${nodeVersion} is below required 18.17.0+`);
  }
} catch (error) {
  console.log(`${colors.red}✗ Failed to check Node.js version: ${error.message}${colors.reset}`);
  allChecksPass = false;
  issues.push('Could not verify Node.js version');
}

// Check pnpm installation
console.log(`\n${colors.bold}2. Checking pnpm installation...${colors.reset}`);
try {
  const pnpmVersion = execSync('pnpm -v').toString().trim();
  console.log(`${colors.green}✓ pnpm version ${pnpmVersion} is installed${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ pnpm is not installed: ${error.message}${colors.reset}`);
  allChecksPass = false;
  issues.push('pnpm is not installed');
}

// Check for environment variables
console.log(`\n${colors.bold}3. Checking environment variables...${colors.reset}`);
if (!fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  console.log(`${colors.red}✗ .env.local file not found${colors.reset}`);
  allChecksPass = false;
  issues.push('.env.local file not found');
} else {
  console.log(`${colors.green}✓ .env.local file exists${colors.reset}`);
  
  // Check required environment variables
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'OPENAI_API_KEY'
  ];
  
  // Either FIREBASE_SERVICE_ACCOUNT_KEY or both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required
  const firebaseAdminVars = [
    ['FIREBASE_SERVICE_ACCOUNT_KEY'],
    ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
  ];
  
  const missingVars = [];
  requiredEnvVars.forEach(envVar => {
    if (!envFile.includes(`${envVar}=`)) {
      missingVars.push(envVar);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`${colors.red}✗ Missing required environment variables: ${missingVars.join(', ')}${colors.reset}`);
    allChecksPass = false;
    issues.push(`Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log(`${colors.green}✓ All basic required environment variables are present${colors.reset}`);
  }
  
  // Check Firebase Admin SDK configuration
  let hasFirebaseAdmin = false;
  for (const varSet of firebaseAdminVars) {
    const hasMissingVar = varSet.some(envVar => !envFile.includes(`${envVar}=`));
    if (!hasMissingVar) {
      hasFirebaseAdmin = true;
      break;
    }
  }
  
  if (!hasFirebaseAdmin) {
    console.log(`${colors.red}✗ Missing Firebase Admin SDK configuration${colors.reset}`);
    console.log(`${colors.yellow}  You need either FIREBASE_SERVICE_ACCOUNT_KEY or both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY${colors.reset}`);
    allChecksPass = false;
    issues.push('Missing Firebase Admin SDK configuration');
  } else {
    console.log(`${colors.green}✓ Firebase Admin SDK configuration is present${colors.reset}`);
  }
}

// Check build artifacts
console.log(`\n${colors.bold}4. Checking build artifacts...${colors.reset}`);
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.log(`${colors.red}✗ .next directory not found. Run 'pnpm build' first${colors.reset}`);
  allChecksPass = false;
  issues.push('.next directory not found - build not created');
} else {
  console.log(`${colors.green}✓ .next directory exists${colors.reset}`);
  
  // Check key build artifacts
  const requiredArtifacts = [
    '.next/standalone',
    '.next/static'
  ];
  
  const missingArtifacts = [];
  requiredArtifacts.forEach(artifact => {
    if (!fs.existsSync(path.join(process.cwd(), artifact))) {
      missingArtifacts.push(artifact);
    }
  });
  
  if (missingArtifacts.length > 0) {
    console.log(`${colors.red}✗ Missing required build artifacts: ${missingArtifacts.join(', ')}${colors.reset}`);
    allChecksPass = false;
    issues.push(`Missing required build artifacts: ${missingArtifacts.join(', ')}`);
  } else {
    console.log(`${colors.green}✓ All required build artifacts are present${colors.reset}`);
  }
}

// Check if port 3006 is available
console.log(`\n${colors.bold}5. Checking if port 3006 is available...${colors.reset}`);
try {
  // Use different command based on OS
  const isWindows = process.platform === 'win32';
  let portInUse = false;
  
  if (isWindows) {
    const output = execSync('netstat -ano | findstr :3006').toString();
    portInUse = output.length > 0;
  } else {
    const output = execSync('lsof -i :3006').toString();
    portInUse = output.length > 0;
  }
  
  if (portInUse) {
    console.log(`${colors.yellow}⚠ Port 3006 is currently in use${colors.reset}`);
    console.log(`${colors.yellow}  You'll need to free this port before starting the server${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Port 3006 is available${colors.reset}`);
  }
} catch (error) {
  // If the command fails because nothing is listening, that's actually good
  console.log(`${colors.green}✓ Port 3006 is available${colors.reset}`);
}

// Summary
console.log(`\n${colors.blue}${colors.bold}=====================================================${colors.reset}`);
console.log(`${colors.blue}${colors.bold}                VERIFICATION SUMMARY                   ${colors.reset}`);
console.log(`${colors.blue}${colors.bold}=====================================================${colors.reset}\n`);

if (allChecksPass) {
  console.log(`${colors.green}${colors.bold}✓ ALL CHECKS PASSED! Your application is ready for deployment.${colors.reset}`);
  console.log(`\nTo start the server, run: ${colors.bold}pnpm start${colors.reset}`);
  console.log(`For production deployment with PM2, run: ${colors.bold}setup-pm2-production.bat${colors.reset} (Windows) or ${colors.bold}chmod +x setup-server.sh && ./setup-server.sh${colors.reset} (Linux)`);
} else {
  console.log(`${colors.red}${colors.bold}✗ SOME CHECKS FAILED! Please fix the following issues:${colors.reset}`);
  issues.forEach((issue, index) => {
    console.log(`${colors.red}${index + 1}. ${issue}${colors.reset}`);
  });
}

console.log(`\n${colors.blue}${colors.bold}=====================================================${colors.reset}`);

// Exit with appropriate code
process.exit(allChecksPass ? 0 : 1); 