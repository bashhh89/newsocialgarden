// Email implementation using Resend API
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Resend API key
const resend = new Resend('re_djZQGEcZ_6JbcA2HVwpTtMQciXiKzepvT');

// Email configuration - using verified socialgarden.com.au domain
const RECIPIENT_EMAIL = 'george@socialgarden.com.au';
const SENDER_EMAIL = 'notifications@socialgarden.com.au';
const SENDER_NAME = 'AI Scorecard';

// Function to log messages and errors
function logToFile(data, filename = 'email-log') {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${filename}-${timestamp}.json`);
    
    fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
    console.log(`Data logged to file: ${logFile}`);
    return true;
  } catch (error) {
    console.error('Error logging to file:', error);
    return false;
  }
}

// Main function to send lead notification
async function sendLeadNotification(leadData) {
  try {
    console.log('Preparing to send lead notification...');
    
    // Ensure required data
    if (!leadData.leadName || !leadData.leadEmail || !leadData.leadCompany) {
      const error = 'Missing required lead data (name, email, or company)';
      console.error(error);
      logToFile({
        error,
        timestamp: new Date().toISOString(),
        leadData
      }, 'email-error');
      throw new Error(error);
    }
    
    // Log the lead data before sending
    logToFile({
      timestamp: new Date().toISOString(),
      message: 'Preparing to send lead notification',
      leadData
    }, 'email-request');
    
    // Create email HTML
    const emailHtml = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .lead-info { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .lead-info p { margin: 5px 0; }
          .footer { font-size: 12px; color: #777; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Lead from AI Scorecard</h1>
          <p>Hi George,</p>
          <p>A new lead has been captured from the AI Scorecard tool. Here are the details:</p>
          
          <div class="lead-info">
            <p><strong>Name:</strong> ${leadData.leadName}</p>
            <p><strong>Company:</strong> ${leadData.leadCompany}</p>
            <p><strong>Email:</strong> ${leadData.leadEmail}</p>
            <p><strong>Phone:</strong> ${leadData.leadPhone || 'Not provided'}</p>
            <p><strong>Industry:</strong> ${leadData.industry || 'Not specified'}</p>
            <p><strong>AI Tier:</strong> ${leadData.aiTier || 'Not specified'}</p>
            <p><strong>Consent:</strong> ${leadData.consent ? 'Yes' : 'No'}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>You may want to reach out to this lead as soon as possible.</p>
          
          <div class="footer">
            <p>This is an automated notification from your AI Scorecard tool.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email using Resend API
    console.log('Sending email to George via Resend...');
    
    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: RECIPIENT_EMAIL,
      subject: `New Lead: ${leadData.leadName} from ${leadData.leadCompany}`,
      html: emailHtml,
      text: `New Lead from AI Scorecard\n\nName: ${leadData.leadName}\nCompany: ${leadData.leadCompany}\nEmail: ${leadData.leadEmail}\nPhone: ${leadData.leadPhone || 'Not provided'}\nIndustry: ${leadData.industry || 'Not specified'}\nAI Tier: ${leadData.aiTier || 'Not specified'}\nConsent: ${leadData.consent ? 'Yes' : 'No'}\nTimestamp: ${new Date().toLocaleString()}`
    });
    
    if (error) {
      throw new Error('Resend API error: ' + error.message);
    }
    
    console.log('Email sent successfully to George\'s inbox!', data);
    
    // Log the successful response
    logToFile({
      timestamp: new Date().toISOString(),
      message: 'Lead notification sent',
      messageId: data.id,
      leadData
    }, 'email-success');
    
    return {
      success: true,
      message: 'Lead notification sent successfully to George\'s inbox',
      info: data
    };
  } catch (error) {
    console.error('Error sending lead notification:', error);
    
    // Log the error
    logToFile({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      leadData
    }, 'email-error');
    
    throw error;
  }
}

module.exports = {
  sendLeadNotification
}; 