# Production Deployment Checklist

This checklist ensures a smooth production deployment. Complete each step in order.

## Pre-Deployment Checks

- [ ] Verify Node.js version is 18.17.0 or higher (`node -v`)
- [ ] Verify pnpm is installed (`pnpm -v`)
- [ ] Ensure all Firebase credentials in `.env.local` are valid and correctly formatted
  - [ ] NEXT_PUBLIC_FIREBASE_API_KEY
  - [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - [ ] NEXT_PUBLIC_FIREBASE_APP_ID
  - [ ] FIREBASE_CLIENT_EMAIL
  - [ ] FIREBASE_PRIVATE_KEY (with proper formatting including newlines)
- [ ] Verify OpenAI API key is valid (OPENAI_API_KEY)
- [ ] Verify Resend API key is valid (RESEND_API_KEY)
- [ ] Check for any ports that need to be closed before deployment

## Build Process

- [ ] Run `pnpm install --frozen-lockfile=false` to install all dependencies
- [ ] Run `pnpm run build` to create production build
  - This will run the enhanced build-production.js script which:
    - Backs up and simplifies problematic API routes
    - Checks environment variables
    - Cleans previous build artifacts
    - Builds the application
    - Restores original API route files
    - Verifies build artifacts
- [ ] Verify that the `.next` directory was created successfully
- [ ] Verify that the `.next/standalone` and `.next/static` directories exist

## Deployment Steps

### For PM2 Deployment (Recommended for Production)

- [ ] Install PM2 globally if not already installed: `npm install -g pm2`
- [ ] For Windows: Run `setup-pm2-production.bat`
- [ ] For Linux: Make the script executable with `chmod +x setup-server.sh` then run `./setup-server.sh`
- [ ] Verify PM2 process is running: `pm2 status`
- [ ] Set PM2 to start on system boot:
  - For Windows: PM2 setup was done by the batch file
  - For Linux: Run `pm2 startup` followed by the command it outputs, then `pm2 save`

### For Standard Deployment

- [ ] Run `pnpm start` to start the production server
- [ ] Verify the application is accessible at the configured port (default: 3006)

## Post-Deployment Verification

- [ ] Verify PDF generation works correctly
- [ ] Test scorecard reporting functionality
- [ ] Verify all API endpoints are responding correctly
- [ ] Check for any console errors or warnings
- [ ] Verify that Firebase connection is working
- [ ] Test email notifications with Resend

## Troubleshooting Common Issues

### If PDF Generation Fails:
- Verify Firebase Admin SDK configuration in `.env.local`
- Check server logs for specific Firebase initialization errors
- Ensure the Firebase project ID matches between client and server

### If Build Fails:
- Check error messages in the console
- Ensure all environment variables are properly set
- Try running with verbose logging: `pnpm run build --verbose`

### If Server Fails to Start:
- Check for port conflicts (default port is 3006)
- Verify Node.js version compatibility
- Check for memory usage issues

## Backup Procedures

- [ ] Create a backup of the `.env.local` file
- [ ] If using Firebase, ensure you have access to the Firebase console
- [ ] Document any custom configurations or changes 