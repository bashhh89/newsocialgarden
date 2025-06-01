/**
 * Update Environment Variables from Template
 * 
 * This script copies environment variables from becauseucantseeenv to .env.local
 */

const fs = require('fs');
const path = require('path');

// Path to files
const templateFilePath = path.join(__dirname, 'becauseucantseeenv');
const envFilePath = path.join(__dirname, '.env.local');

console.log('\n=== Updating Environment Variables from Template ===\n');

try {
  // Check if template file exists
  if (!fs.existsSync(templateFilePath)) {
    console.error('Template file not found:', templateFilePath);
    process.exit(1);
  }
  
  // Read template file
  const templateContent = fs.readFileSync(templateFilePath, 'utf8');
  
  // Write to .env.local
  fs.writeFileSync(envFilePath, templateContent);
  
  console.log('Successfully copied environment variables from template to .env.local');
  console.log('\n=== Update Complete ===');
  console.log('You can now restart the development server with:');
  console.log('pnpm dev');
} catch (error) {
  console.error('Error:', error);
} 