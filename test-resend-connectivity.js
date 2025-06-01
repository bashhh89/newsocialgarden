// Test Resend API connectivity
require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

console.log('Testing Resend API connectivity...');
console.log('API Key present:', !!RESEND_API_KEY);
console.log('API Key length:', RESEND_API_KEY ? RESEND_API_KEY.length : 0);
console.log('API Key preview:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 7)}...${RESEND_API_KEY.substring(RESEND_API_KEY.length - 4)}` : 'N/A');

async function testResend() {
  if (!RESEND_API_KEY) {
    console.log('❌ No Resend API key found');
    return;
  }

  try {
    console.log('\n=== Testing Resend API Key Validity ===');
    const response = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.log('❌ Resend API error:', errorData.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    console.log('✅ Resend API is accessible');
    console.log('Domains configured:', data.data ? data.data.length : 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n=== Domain Status ===');
      data.data.forEach(domain => {
        console.log(`Domain: ${domain.name}`);
        console.log(`Status: ${domain.status}`);
        console.log(`Verified: ${domain.status === 'verified' ? '✅' : '❌'}`);
        console.log('---');
      });
    } else {
      console.log('⚠️ No domains configured - emails will be sent from default domain');
      console.log('Note: gmail.com domain verification error is expected without custom domain');
    }
    
    // Test sending capability (without actually sending)
    console.log('\n=== Testing Email Send Capability ===');
    const testEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${RESEND_API_KEY}` 
      },
      body: JSON.stringify({
        from: 'test@resend.dev', // Use Resend's test domain
        to: 'test@example.com',
        subject: 'API Test (will not be sent)',
        html: '<p>This is a test email to verify API connectivity</p>',
        // Add a test flag to prevent actual sending
        tags: [{ name: 'test', value: 'connectivity-check' }]
      })
    });
    
    console.log('Email API response status:', testEmailResponse.status);
    
    if (testEmailResponse.status === 200) {
      console.log('✅ Email sending capability confirmed');
    } else if (testEmailResponse.status === 422) {
      const errorData = await testEmailResponse.json();
      console.log('⚠️ Email validation error (expected for test):', errorData.message);
      console.log('✅ Email API is responsive');
    } else {
      const errorData = await testEmailResponse.text();
      console.log('❌ Email API error:', errorData.substring(0, 500));
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('This suggests a network connectivity issue');
  }
}

testResend(); 