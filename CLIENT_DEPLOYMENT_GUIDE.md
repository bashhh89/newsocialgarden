# 🚀 Social Garden AI Scorecard - Client Deployment Guide

## Overview
The Social Garden AI Scorecard is a fully functional Next.js application that helps businesses assess their AI maturity. This guide will help you deploy it on your infrastructure.

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js 18+** installed
- **Git** installed
- **A server** (Ubuntu/Linux recommended)
- **Firebase project** (for database)
- **OpenAI API key** (for AI functionality)
- **Resend API key** (for email notifications)

## ⚡ Quick Deployment

### Step 1: Clone the Repository
```bash
git clone https://github.com/bashhh89/newsocialgarden.git
cd newsocialgarden
```

### Step 2: Install Dependencies
```bash
# Install pnpm globally (recommended package manager)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Step 3: Configure Environment Variables
```bash
# Copy the environment template
cp .env.local.example .env.local

# Edit the file with your credentials
nano .env.local
```

Add your configuration:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Keys
OPENAI_API_KEY=your_openai_key_here
RESEND_API_KEY=your_resend_key_here

# Optional: Enable auto-complete feature
NEXT_PUBLIC_ENABLE_AUTO_COMPLETE=true
```

### Step 4: Build the Application
```bash
pnpm run build
```

### Step 5: Start the Application
```bash
# Development mode (for testing)
pnpm run dev

# Production mode
pnpm start
```

## 🔥 Production Deployment with PM2 (Recommended)

For production environments, use PM2 for process management:

### Install PM2
```bash
npm install -g pm2
```

### Start the Application
```bash
# Start with PM2
pm2 start npm --name "social-garden-scorecard" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### PM2 Management Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs social-garden-scorecard

# Restart application
pm2 restart social-garden-scorecard

# Stop application
pm2 stop social-garden-scorecard
```

## 🌐 Alternative Deployment Options

### Option 1: Vercel (Easiest)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Option 2: Netlify
1. Connect GitHub repository to Netlify
2. Set build command: `pnpm run build`
3. Set publish directory: `.next`
4. Add environment variables

### Option 3: Digital Ocean App Platform
1. Create new app from GitHub repository
2. Set build command: `pnpm run build`
3. Set run command: `pnpm start`
4. Add environment variables

## 🎯 Application Features

### What You Get:
- ✅ **AI Efficiency Scorecard** - 20-question assessment
- ✅ **Responsive Design** - Works on mobile and desktop
- ✅ **PDF Generation** - Download results as PDF
- ✅ **Lead Capture** - Collect user information
- ✅ **Email Notifications** - Automated lead notifications
- ✅ **Learning Hub** - Educational content and resources
- ✅ **Admin Dashboard** - Debug and monitoring tools

### Access Points:
- **Main Application:** `http://your-domain:3006`
- **Learning Hub:** `http://your-domain:3006/learning-hub`
- **Admin Debug:** `http://your-domain:3006/admin/debug-session`

## 🔧 Configuration Details

### Required Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI functionality | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Yes |
| `NEXT_PUBLIC_ENABLE_AUTO_COMPLETE` | Enable auto-complete feature | No |

### Firebase Setup:
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Create a new web app and copy the configuration
4. Set up Firestore security rules (provided in the repository)

### OpenAI Setup:
1. Create an account at https://platform.openai.com
2. Generate an API key
3. Ensure you have sufficient credits/quota

### Resend Setup:
1. Create an account at https://resend.com
2. Generate an API key
3. Configure your sending domain (optional)

## 🚀 Performance & Scaling

### Server Requirements:
- **Minimum:** 1 CPU, 1GB RAM
- **Recommended:** 2 CPU, 2GB RAM
- **Storage:** 10GB minimum

### Scaling Considerations:
- Use a load balancer for multiple instances
- Consider Redis for session storage
- Monitor Firebase usage limits
- Set up proper logging and monitoring

## 🛠 Troubleshooting

### Common Issues:

**Port 3006 already in use:**
```bash
npx kill-port 3006
```

**Build fails:**
```bash
# Clear Next.js cache
rm -rf .next
pnpm run build
```

**PM2 process won't start:**
```bash
# Check PM2 logs
pm2 logs social-garden-scorecard

# Restart PM2
pm2 restart social-garden-scorecard
```

**Firebase connection issues:**
- Verify all environment variables are set correctly
- Check Firebase project permissions
- Ensure Firestore is enabled

## 📞 Support

For technical support or customizations, contact the development team.

## 📝 License

This application is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

---

**🎉 Your AI Scorecard is ready to help businesses assess their AI maturity!** 