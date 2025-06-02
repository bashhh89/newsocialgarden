const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔥 Testing Firebase Configuration...\n');

// Test 1: Check environment variables
console.log('1. Checking Firebase environment variables...');
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = [];
const presentVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    presentVars.push(varName);
    console.log(`   ✅ ${varName}: ${process.env[varName].substring(0, 20)}...`);
  } else {
    missingVars.push(varName);
    console.log(`   ❌ ${varName}: NOT SET`);
  }
});

if (missingVars.length > 0) {
  console.log(`\n❌ Missing ${missingVars.length} required Firebase environment variables:`);
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease add these to your .env.local file.');
  process.exit(1);
}

// Test 2: Initialize Firebase
console.log('\n2. Testing Firebase initialization...');
try {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  console.log('   ✅ Firebase app initialized successfully');
  console.log(`   ✅ Project ID: ${firebaseConfig.projectId}`);
} catch (error) {
  console.log('   ❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

// Test 3: Test Firestore connection
console.log('\n3. Testing Firestore connection...');
try {
  const db = getFirestore();
  console.log('   ✅ Firestore instance created successfully');
  
  // Note: We can't actually test the connection without making a request
  // which would require proper authentication in a real environment
  console.log('   ℹ️  Firestore connection will be tested when first used');
} catch (error) {
  console.log('   ❌ Firestore connection failed:', error.message);
  process.exit(1);
}

// Test 4: Check Firebase Admin SDK configuration (optional)
console.log('\n4. Checking Firebase Admin SDK configuration...');
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.log('   ✅ FIREBASE_SERVICE_ACCOUNT_KEY is set');
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);
    console.log(`   ✅ Service account project: ${serviceAccount.project_id}`);
    console.log(`   ✅ Service account email: ${serviceAccount.client_email}`);
    
    if (serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.log('   ⚠️  WARNING: Service account project ID does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    }
  } catch (error) {
    console.log('   ❌ Failed to decode service account key:', error.message);
  }
} else {
  console.log('   ⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not set (required for server-side operations)');
}

console.log('\n🎉 Firebase configuration test completed!');
console.log('\nNext steps:');
console.log('- If any environment variables are missing, add them to .env.local');
console.log('- Test actual Firestore operations in your application');
console.log('- Verify Firebase Admin SDK if server-side operations are needed'); 