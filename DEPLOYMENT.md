# SaveBite Deployment Guide

This guide walks you through deploying the SaveBite app to Firebase Hosting using Google Cloud Build.

## Prerequisites

- Firebase project: `gen-lang-client-0558617691`
- GitHub repository: `onkardamal/foodrescue-ai`
- Cloud Build trigger: `foodrescue-ai-deploy` (configured to watch `main` branch)

## Step 1: Generate Firebase CI Token

You need to generate a Firebase token for Cloud Build to authenticate:

1. **Open a terminal/command prompt** (this requires interactive login)

2. **Run the following command:**
   ```bash
   firebase login:ci
   ```

3. **Follow the prompts:**
   - It will open your browser for authentication
   - After logging in, it will display a token like: `1//abc123...`

4. **Copy the token** - you'll need it in the next step

## Step 2: Configure Cloud Build Trigger

### Option A: Using Google Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Build** → **Triggers**
3. Find and click on **`foodrescue-ai-deploy`** trigger
4. Click **Edit**
5. Scroll down to **Substitution variables**
6. Add the following variables:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `_FIREBASE_TOKEN` | `[Your token from Step 1]` | Firebase CI token |
   | `_GEMINI_API_KEY` | `[Your Gemini API key]` | Required for AI features |
   | `_GOOGLE_CLIENT_ID` | `[Your Google OAuth Client ID]` | Optional, for Google Sign-In |
   | `_FIREBASE_CONFIG` | `[JSON config]` | Firebase config (see below) |

7. **For `_FIREBASE_CONFIG`**, use this format (replace with your actual values):
   ```json
   {"apiKey":"YOUR_API_KEY","authDomain":"gen-lang-client-0558617691.firebaseapp.com","projectId":"gen-lang-client-0558617691","storageBucket":"gen-lang-client-0558617691.appspot.com","messagingSenderId":"YOUR_SENDER_ID","appId":"YOUR_APP_ID"}
   ```
   
   You can find these values in:
   - Firebase Console → Project Settings → General → Your apps → Web app config

8. Click **Save**

### Option B: Using gcloud CLI

If you have gcloud CLI installed:

```bash
# Set the project
gcloud config set project gen-lang-client-0558617691

# Update the trigger with substitutions
gcloud builds triggers update foodrescue-ai-deploy \
  --substitutions=_FIREBASE_TOKEN="YOUR_FIREBASE_TOKEN",_GEMINI_API_KEY="YOUR_GEMINI_KEY",_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID",_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"..."}'
```

## Step 3: Commit and Push

1. **Commit the `cloudbuild.yaml` file:**
   ```bash
   git add cloudbuild.yaml
   git commit -m "Add Cloud Build configuration for Firebase deployment"
   git push origin main
   ```

2. **Cloud Build will automatically:**
   - Detect the push to `main` branch
   - Start the build process
   - Install dependencies
   - Build the app with environment variables
   - Deploy to Firebase Hosting

## Step 4: Monitor Deployment

1. Go to [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)
2. You should see a new build triggered by your push
3. Click on it to see the build logs
4. Wait for it to complete (usually 2-5 minutes)

## Step 5: Verify Deployment

Once the build completes successfully:

1. Visit your deployed app:
   - **Primary URL:** https://gen-lang-client-0558617691.web.app
   - **Custom domain:** (if configured)

2. **Test the app:**
   - Login functionality
   - AI features (if GEMINI_API_KEY is set)
   - Firebase Authentication
   - All routes and navigation

## Troubleshooting

### Build Fails with "FIREBASE_TOKEN not set"
- Make sure you added `_FIREBASE_TOKEN` in the Cloud Build trigger substitutions
- Verify the token is still valid (tokens can expire)

### Build Succeeds but App Shows Errors
- Check browser console for errors
- Verify environment variables are set correctly
- Check Firebase config is valid JSON

### Environment Variables Not Working
- Ensure variables are prefixed with `_` in Cloud Build (e.g., `_GEMINI_API_KEY`)
- Check that variables are passed to the build step in `cloudbuild.yaml`
- Verify Vite can access them via `process.env`

### Firebase Deploy Fails
- Check Firebase project permissions
- Verify `firebase.json` is correct
- Ensure `dist` folder is being generated

## Environment Variables Reference

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `_FIREBASE_TOKEN` | ✅ Yes | Firebase CI token | `firebase login:ci` |
| `_GEMINI_API_KEY` | ⚠️ For AI | Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `_GOOGLE_CLIENT_ID` | ❌ Optional | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `_FIREBASE_CONFIG` | ✅ Yes | Firebase web app config | Firebase Console → Project Settings |

## Manual Deployment (Alternative)

If you want to deploy manually without Cloud Build:

```bash
# Build locally
npm install
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Next Steps

- Set up custom domain (optional)
- Configure Firebase Hosting redirects if needed
- Set up monitoring and alerts
- Configure CDN caching rules

---

**Need Help?** Check the [Firebase Hosting Docs](https://firebase.google.com/docs/hosting) or [Cloud Build Docs](https://cloud.google.com/build/docs)
