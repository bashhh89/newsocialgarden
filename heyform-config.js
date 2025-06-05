// Configuration for self-hosted Heyform webhook

// The URL of your self-hosted Heyform instance
module.exports = {
  // This is the base URL of your Heyform instance
  baseUrl: 'https://socialgarden-heyform.vo0egb.easypanel.host',
  
  // Form ID from the URL (extracted from the URL you shared)
  formId: '4tuLxlT8',
  
  // Webhook endpoint is now configured in the Heyform admin panel
  // This is now the endpoint to receive webhooks from Heyform
  receiveWebhookEndpoint: '/api/send-lead-notification',
  
  // The full webhook URL - try different formats based on Heyform documentation
  // This will be used when sending data TO Heyform
  get webhookUrl() {
    // First try the standard format
    return `${this.baseUrl}/webhook/${this.formId}`;
  },
  
  // Email notification recipient
  notificationEmail: 'george@socialgarden.com.au',
  
  // Logging level for debugging
  loggingEnabled: true,
  
  // Whether to log to file even if Heyform submission succeeds
  alwaysLogToFile: true,
  
  // Configuration options
  options: {
    // Retry attempts for sending to Heyform
    maxRetries: 3,
    // Timeout in milliseconds
    timeout: 10000,
    // Fields to include in the form submission
    requiredFields: ['name', 'email', 'company'],
    // Custom headers to send with the request
    headers: {
      'User-Agent': 'AI-Scorecard/1.0',
      'X-Source': 'AI-Scorecard-Lead-Notification'
    }
  },
  
  // List all possible webhook URLs to try (for testing)
  webhookEndpoints: [
    // Standard format
    '/webhook/${formId}',
    // API-style format
    '/api/webhook/${formId}',
    // Simplified format
    '/webhook',
    // Direct form submission
    '/api/forms/${formId}/submissions',
    // With form prefix
    '/forms/${formId}/webhook',
    // API v1 style
    '/api/v1/webhooks/${formId}',
    // Public submissions endpoint
    '/api/public/forms/${formId}/submissions'
  ],
  
  // Function to get all possible webhook URLs
  getAllWebhookUrls() {
    return this.webhookEndpoints.map(endpoint => 
      this.baseUrl + endpoint.replace('${formId}', this.formId)
    );
  }
}; 