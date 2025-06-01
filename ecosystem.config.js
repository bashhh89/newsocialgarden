module.exports = {
  apps: [
    {
      name: 'aiscorecard',
      script: 'start-production.js',
      cwd: '/root/newfixsg',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006,
        USE_GEORGE_KEY: "true",
        OPENAI_API_KEY: "YOUR_OPENAI_API_KEY_HERE",
        OPENAI_MODEL: "gpt-4o",
        GOOGLE_API_KEY: "YOUR_GOOGLE_API_KEY_HERE",
        GOOGLE_MODEL: "gemini-2.0-flash",
        POLLINATIONS_MODEL: "openai-large",
        RESEND_API_KEY: "YOUR_RESEND_API_KEY_HERE",
        LEAD_NOTIFICATION_EMAIL: "george@socialgarden.com.au",
        NEXT_PUBLIC_ENABLE_AUTO_COMPLETE: "true",
        WEASYPRINT_SERVICE_URL: "http://168.231.115.219:5001/generate-pdf",
        NEXT_PUBLIC_FIREBASE_API_KEY: "YOUR_FIREBASE_API_KEY_HERE",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "your-project.firebaseapp.com",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "your-project-id",
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "your-project.appspot.com",
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "YOUR_SENDER_ID",
        NEXT_PUBLIC_FIREBASE_APP_ID: "YOUR_APP_ID",
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "YOUR_MEASUREMENT_ID"
      },
      env_file: '.env.local',
      max_memory_restart: '1G',
      error_file: '/root/logs/aiscorecard-error.log',
      out_file: '/root/logs/aiscorecard-out.log',
      log_file: '/root/logs/aiscorecard-combined.log',
      time: true,
      merge_logs: true
    }
  ]
}; 