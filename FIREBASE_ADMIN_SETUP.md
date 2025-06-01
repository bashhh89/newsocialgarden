# Firebase Admin SDK Setup Guide

This guide will help you set up the Firebase Admin SDK for PDF generation in the AI Scorecard application.

## Why Firebase Admin SDK is Required

The PDF generation feature in the AI Scorecard application requires server-side access to your Firebase Firestore database. This is accomplished using the Firebase Admin SDK, which needs proper credentials to authenticate with Firebase.

## Step 1: Get Your Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to access Project settings
4. Go to the "Service accounts" tab
5. Click "Generate new private key" button
6. Save the JSON file securely (this contains sensitive credentials)

## Step 2: Choose Your Configuration Method

You can configure the Firebase Admin SDK in one of two ways:

### Option 1: Using Base64 Encoded Service Account Key (Recommended)

This method is simpler and less prone to formatting issues:

1. Convert your service account JSON file to a Base64 string:

   **On Linux/Mac:**
   ```bash
   cat your-service-account-file.json | base64 -w 0
   ```

   **On Windows (PowerShell):**
   ```powershell
   $bytes = [System.IO.File]::ReadAllBytes("your-service-account-file.json")
   [System.Convert]::ToBase64String($bytes)
   ```

2. Add the Base64 string to your `.env.local` file:
   ```
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_KEY=your-base64-encoded-service-account-key
   ```

### Option 2: Using Client Email and Private Key

1. Open the downloaded JSON file
2. Extract the `client_email` and `private_key` values
3. Add them to your `.env.local` file:
   ```
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEF...\n-----END PRIVATE KEY-----\n"
   ```

Important notes for Option 2:
- The `FIREBASE_PRIVATE_KEY` must include the quotes and all newline characters (`\n`)
- Make sure the `project_id` in the service account matches your `NEXT_PUBLIC_FIREBASE_PROJECT_ID` environment variable

## Step 3: Test Your Configuration

Run the test script to verify your Firebase Admin SDK configuration:

```bash
node test-firebase-admin.js
```

If successful, you should see:
```
Testing Firebase Admin SDK configuration...
✅ Found FIREBASE_SERVICE_ACCOUNT_KEY in environment variables.
✅ Successfully decoded service account key from Base64.
✅ Firebase Admin SDK initialized successfully.
✅ Firestore connection established.
✅ Firestore query executed successfully.

✅ SUCCESS: Your Firebase Admin SDK configuration is working correctly!
PDF generation should work properly with this configuration.
```

## Troubleshooting

### Error: "Failed to decode service account key"

This usually happens when the Base64 string is invalid. Make sure:
1. You copied the entire Base64 string without any line breaks
2. The original JSON file was valid

### Error: "The provided private key is invalid"

This usually happens when the private key format is incorrect. Make sure:
1. The key includes the BEGIN and END markers
2. All newline characters (`\n`) are preserved
3. The key is enclosed in quotes in your `.env.local` file

### Error: "Permission denied"

This means your service account doesn't have sufficient permissions:
1. Go to the Firebase Console > Project settings > Service accounts
2. Make sure the service account has the "Firebase Admin" role
3. If using custom roles, ensure it has at least read access to Firestore

### Error: "Project ID mismatch"

Make sure your `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches the `project_id` in your service account JSON file.

## Security Considerations

- Never commit your service account key to version control
- Store your `.env.local` file securely
- Consider using environment variable management systems for production deployments
- Restrict your service account permissions to only what's necessary

For additional help, refer to the [Firebase Admin SDK documentation](https://firebase.google.com/docs/admin/setup). 