// Test API Connectivity Script
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testOpenAI() {
  try {
    console.log('🔍 Testing OpenAI API connectivity...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY not found in environment');
      return false;
    }
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Test connection - respond with just "OK"' }],
      max_tokens: 5,
    });
    
    console.log('✅ OpenAI API Response:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.log('❌ OpenAI API Error:', error.message);
    return false;
  }
}

async function testWeasyPrint() {
  try {
    console.log('🔍 Testing WeasyPrint service...');
    
    const response = await fetch('http://168.231.115.219:5001/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: '<h1>Test PDF</h1><p>Service connectivity test</p>',
      }),
    });
    
    if (response.ok) {
      console.log('✅ WeasyPrint Service: Working (Status:', response.status, ')');
      return true;
    } else {
      console.log('❌ WeasyPrint Service Error: Status', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ WeasyPrint Service Error:', error.message);
    return false;
  }
}

async function testResend() {
  try {
    console.log('🔍 Testing Resend API...');
    
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY not found in environment');
      return false;
    }
    
    // Just test API key validity, don't send actual email
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });
    
    if (response.ok) {
      console.log('✅ Resend API: Key is valid');
      return true;
    } else {
      console.log('❌ Resend API Error: Status', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Resend API Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Connectivity Tests...\n');
  
  const results = {
    openai: await testOpenAI(),
    weasyprint: await testWeasyPrint(),
    resend: await testResend(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('OpenAI API:', results.openai ? '✅ Working' : '❌ Failed');
  console.log('WeasyPrint Service:', results.weasyprint ? '✅ Working' : '❌ Failed');
  console.log('Resend API:', results.resend ? '✅ Working' : '❌ Failed');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 Overall Status:', allPassed ? '✅ All services operational' : '⚠️ Some services have issues');
  
  process.exit(allPassed ? 0 : 1);
}

runTests(); 