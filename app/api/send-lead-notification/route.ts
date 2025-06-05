import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Import the Heyform config if available
let heyformConfig: any;
try {
  heyformConfig = require('../../../heyform-config');
  console.log('Loaded Heyform config - using baseUrl:', heyformConfig.baseUrl);
} catch (error) {
  console.warn('Could not load heyform-config.js - using file logging only');
  heyformConfig = null;
}

// Try to import the Nodemailer sender if available
let nodemailerSender: any;
try {
  nodemailerSender = require('../../../send-lead-resend');
  console.log('Loaded Resend sender - will use for email notifications');
} catch (error) {
  console.warn('Could not load send-lead-resend.js - will not send emails');
  nodemailerSender = null;
}

// Function to log lead information to a file (our reliable fallback)
function logLeadToFile(leadInfo: any) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `lead-notification-${timestamp}.json`);
    
    fs.writeFileSync(logFile, JSON.stringify(leadInfo, null, 2));
    console.log(`Lead information logged to file: ${logFile}`);
    return { success: true, logFile };
  } catch (error) {
    console.error('Error logging lead to file:', error);
    return { success: false, error };
  }
}

// Function to attempt sending via Resend
async function sendViaEmail(data: any): Promise<{ success: boolean, method: string, error?: any }> {
  if (!nodemailerSender) {
    return { success: false, method: 'none', error: 'Email sender not configured' };
  }
  
  try {
    console.log('Attempting to send notification via Resend...');
    
    // Map data to the format expected by the email sender
    const leadData = {
      leadName: data.leadName,
      leadEmail: data.leadEmail,
      leadCompany: data.leadCompany,
      leadPhone: data.leadPhone || 'Not provided',
      industry: data.industry || 'Not specified',
      aiTier: data.aiTier || 'Not specified',
      consent: data.consent || false,
      type: data.type || 'Unknown'
    };
    
    const result = await nodemailerSender.sendLeadNotification(leadData);
    console.log('Email sent successfully to George\'s inbox!');
    
    return { 
      success: true, 
      method: 'email'
    };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { 
      success: false, 
      method: 'email-failed',
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Function to attempt sending to Heyform (if configured)
async function sendToHeyform(data: any): Promise<{ success: boolean, method: string, error?: any }> {
  // If Heyform is not configured, skip this step
  if (!heyformConfig) {
    return { success: false, method: 'none', error: 'Heyform not configured' };
  }
  
  try {
    // First try the configured webhook endpoint if available
    if (heyformConfig.webhookUrl) {
      try {
        console.log('Attempting to send to configured webhook:', heyformConfig.webhookUrl);
        
        const response = await fetch(heyformConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          console.log('Successfully sent to webhook');
          return { success: true, method: 'webhook' };
        }
        
        console.log(`Webhook returned status ${response.status}, trying direct form submission...`);
      } catch (error) {
        console.error('Error sending to webhook:', error);
        console.log('Trying direct form submission...');
      }
    }
    
    // If we get here, webhook failed or isn't configured
    // Attempt direct form submission if a form ID is available
    if (heyformConfig.formId) {
      const formId = heyformConfig.formId;
      const submissionEndpoints = [
        `/form/${formId}/submit`,
        `/api/forms/${formId}/submit`,
        `/submit/${formId}`,
        `/f/${formId}`
      ];
      
      // Try each endpoint until one works
      for (const endpoint of submissionEndpoints) {
        try {
          const submissionUrl = heyformConfig.baseUrl + endpoint;
          console.log(`Trying direct form submission to: ${submissionUrl}`);
          
          const response = await fetch(submissionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.formData || data)
          });
          
          if (response.ok) {
            console.log(`Successfully submitted to form via ${endpoint}`);
            return { success: true, method: 'form-submission' };
          }
        } catch (error) {
          console.error(`Error submitting to ${endpoint}:`, error);
        }
      }
    }
    
    return { 
      success: false, 
      method: 'attempted',
      error: 'All Heyform submission methods failed' 
    };
  } catch (error) {
    return { 
      success: false, 
      method: 'error',
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      leadName,
      leadCompany,
      leadEmail,
      leadPhone,
      industry,
      consent,
      aiTier,
      type,
      reportMarkdown,
      questionAnswerHistory
    } = body;

    // Validate required fields
    if (!leadName || !leadCompany || !leadEmail || consent === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields. Name, company, email, and consent are required.' },
        { status: 400 }
      );
    }

    // Notification recipient (from config or fallback)
    const recipientEmail = heyformConfig?.notificationEmail || 'george@socialgarden.com.au';
    
    // Email subject based on lead type
    const emailSubject = type === 'leadCapture' 
      ? `New AI Scorecard Assessment Started by ${leadName} from ${leadCompany}`
      : `AI Scorecard Assessment Completed by ${leadName} from ${leadCompany}`;

    // Create lead info object with all data
    const leadInfo = {
      timestamp: new Date().toISOString(),
        subject: emailSubject,
        recipient: recipientEmail,
        leadName,
        leadCompany,
        leadEmail,
        leadPhone,
      industry,
      consent,
        aiTier,
      type,
      // Format data for form submission
      formData: {
        name: leadName,
        company: leadCompany,
        email: leadEmail,
        phone: leadPhone || 'Not provided',
        industry: industry || 'Not specified',
        aiTier: aiTier || 'Not available',
        assessmentType: type,
        emailRecipient: recipientEmail,
        source: 'AI Scorecard',
        timestamp: new Date().toISOString(),
        consentGiven: consent ? 'Yes' : 'No',
        message: `${type === 'leadCapture' ? 'Started' : 'Completed'} AI Scorecard Assessment`
      }
    };

    // ALWAYS log to file first for reliability
    const logResult = logLeadToFile(leadInfo);
    
    // First, try sending via Nodemailer email
    const emailResult = await sendViaEmail(leadInfo);
    
    // If email fails, try to send to Heyform as a backup
    let heyformResult = { success: false, method: 'not-attempted' };
    if (!emailResult.success) {
      heyformResult = await sendToHeyform(leadInfo);
    }
    
    // Determine the overall result message
    let message = '';
    let successMethod = '';
    
    if (emailResult.success) {
      message = 'Lead notification sent successfully via email';
      successMethod = 'email';
    } else if (heyformResult.success) {
      message = `Lead notification sent successfully via Heyform (${heyformResult.method})`;
      successMethod = `heyform-${heyformResult.method}`;
    } else if (logResult.success) {
      message = 'Lead captured successfully and saved to log file';
      successMethod = 'file-log-only';
    } else {
      message = 'Lead processing encountered errors, but data was captured';
      successMethod = 'error-fallback';
    }
    
    // Return success response with details
    return NextResponse.json({
      message,
      method: successMethod,
      fileLogged: logResult.success,
      emailSent: emailResult.success,
      heyformSent: heyformResult.success,
      heyformMethod: heyformResult.method
    });
  } catch (error) {
    console.error('Error processing lead notification:', error);
    
    // Try to log the error to file
    try {
      logLeadToFile({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } catch (logError) {
      console.error('Failed to log error to file:', logError);
    }
    
    // Always return success to not block user flow
    return NextResponse.json({
      message: 'Lead information processed with errors',
      error: 'See server logs for details'
    });
  }
}
