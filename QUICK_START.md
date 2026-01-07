# 🚀 Quick Start - SaveBite Deployment

## ✅ What's Been Set Up

1. **`cloudbuild.yaml`** - Cloud Build configuration for automatic deployment
2. **`DEPLOYMENT.md`** - Complete deployment guide with step-by-step instructions
3. **Updated `vite.config.ts`** - Now handles all environment variables
4. **Updated `README.md`** - Enhanced with deployment and project info
5. **`.env.example`** - Template for environment variables

## 🎯 Next Steps (Do These Now)

### 1. Generate Firebase Token (5 minutes)

Open a terminal and run:
```bash
firebase login:ci
```

This will:
- Open your browser for authentication
- Display a token (copy it!)

### 2. Get Your Firebase Config (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `gen-lang-client-0558617691`
3. Click ⚙️ **Project Settings** → **General** tab
4. Scroll to **Your apps** → Find your **Web app**
5. Click **Config** - copy the JSON config object

### 3. Configure Cloud Build Trigger (10 minutes)

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click on **`foodrescue-ai-deploy`** trigger
3. Click **Edit**
4. Scroll to **Substitution variables**
5. Add these 4 variables:

   | Variable | Value |
   |----------|-------|
   | `_FIREBASE_TOKEN` | `[Token from Step 1]` |
   | `_GEMINI_API_KEY` | `[Your Gemini API key]` |
   | `_GOOGLE_CLIENT_ID` | `[Your Google Client ID]` (optional) |
   | `_FIREBASE_CONFIG` | `[JSON from Step 2]` |

6. Click **Save**

### 4. Commit and Push (2 minutes)

```bash
git add cloudbuild.yaml DEPLOYMENT.md README.md .env.example vite.config.ts
git commit -m "Add Cloud Build deployment configuration"
git push origin main
```

### 5. Watch It Deploy! 🎉

1. Go to [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)
2. You'll see a new build starting automatically
3. Wait 2-5 minutes for it to complete
4. Visit: **https://gen-lang-client-0558617691.web.app**

## 📋 Checklist

- [ ] Generated Firebase token (`firebase login:ci`)
- [ ] Got Firebase config from Firebase Console
- [ ] Added all 4 substitution variables to Cloud Build trigger
- [ ] Committed and pushed `cloudbuild.yaml` to `main` branch
- [ ] Verified build is running in Cloud Build
- [ ] Tested deployed app at Firebase Hosting URL

## 🆘 Need Help?

- **Detailed guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Environment variables:** See [.env.example](./.env.example)
- **Firebase docs:** https://firebase.google.com/docs/hosting
- **Cloud Build docs:** https://cloud.google.com/build/docs

## 🔑 Where to Get API Keys

- **Gemini API Key:** https://makersuite.google.com/app/apikey
- **Google OAuth Client ID:** https://console.cloud.google.com/apis/credentials
- **Firebase Config:** Firebase Console → Project Settings → General → Your apps

---

**That's it!** Once you complete these steps, every push to `main` will automatically deploy your app. 🚀
