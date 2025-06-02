module.exports = {
  apps: [
    {
      name: 'sg-ai-scorecard',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
        NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyAS9xP6FrtPxiwONibV562dpXa5lqjAJ2E',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'social-garden-94046.firebaseapp.com',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'social-garden-94046',
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'social-garden-94046.appspot.com',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '794445598230',
        NEXT_PUBLIC_FIREBASE_APP_ID: '1:794445598230:web:b614a432c0f96b49f86f37',
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-HW572B7L9R'
      },
      // Health check integration
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      // Health check configuration
      health_check: {
        enabled: true,
        script: './scripts/health-check.js',
        period: 60000,  // Check every 1 minute
        action: 'restart',  // Restart the app if health check fails
        threshold: 3,  // Tolerate 3 failed checks before action
      },
      // Startup monitoring - ensures app starts correctly
      wait_ready: true,
      listen_timeout: 30000,
      // Log configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      // Crash recovery
      autorestart: true,
      // Resource control
      max_memory_restart: '1G',
    },
    {
      name: 'health-monitor',
      script: './scripts/health-check.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '*/15 * * * *', // Run every 15 minutes
      watch: false,
      autorestart: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
