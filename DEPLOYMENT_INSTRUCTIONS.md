# Deployment Instructions

## Server Requirements
- Node.js 18.17.0 or higher
- pnpm package manager (will be installed by the script if not present)
- Git

## Deployment Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd final
```

### 2. Set Environment Variables
Create a `.env.local` file in the root directory with the following variables:
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Firebase ADMIN SDK Configuration (REQUIRED for PDF generation)
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"

# OpenAI Configuration (if used)
OPENAI_API_KEY=your_openai_api_key

# Resend Configuration (for email notifications)
RESEND_API_KEY=your_resend_api_key
LEAD_NOTIFICATION_EMAIL=your_notification_email@example.com

# Other Configuration
NEXT_PUBLIC_ENABLE_AUTO_COMPLETE=true
```

> **IMPORTANT**: The PDF generation feature requires proper Firebase Admin SDK configuration. Make sure to set both `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` correctly, or you will receive a "Database connection not available" error when trying to download PDFs.

### 3. Run the Installation Script
```bash
chmod +x server-install.sh
./server-install.sh
```

This script will:
- Check if pnpm is installed and install it if needed
- Verify Firebase configuration for PDF generation
- Install all dependencies
- Build the application

### 4. Start the Production Server
```bash
pnpm start
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

### 5. Using Process Manager (Recommended)
For production deployments, it's recommended to use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start the application with PM2
pm2 start npm --name "aiscorecard" -- start

# Set up PM2 to start on system boot
pm2 startup
pm2 save
```

## Troubleshooting

### PDF Generation Issues
If you encounter "Internal Server Error: Database connection not available" when trying to download PDFs:

1. Verify your Firebase Admin SDK configuration in `.env.local`:
   ```
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"
   ```

2. Make sure the Firebase project ID matches between client and server:
   ```
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

3. Check server logs for specific Firebase initialization errors

### Installation Issues
If you encounter issues during installation:

1. Make sure Node.js version is correct:
```bash
node -v
```

2. Try clearing pnpm cache:
```bash
pnpm store prune
```

3. If specific packages fail to install, try installing them individually:
```bash
pnpm add <package-name>
```

### Build Issues
If the build fails:

1. Check the error messages in the console
2. Ensure all environment variables are properly set
3. Try running with verbose logging:
```bash
pnpm run build --verbose
```

### Runtime Issues
If the application runs but encounters errors:

1. Check the server logs
2. Verify that all environment variables are correctly set
3. Ensure Firebase configuration is correct

For any persistent issues, please contact the development team. 