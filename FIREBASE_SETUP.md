# Firebase Authentication Setup Guide

This guide will help you configure Firebase Authentication for the SaveBite application.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com/)
2. Firebase project ID: `gen-lang-client-0558617691` (or update in `.firebaserc`)

## Step 1: Enable Authentication Methods

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the following providers:
   - **Email/Password**: Enable and save
   - **Google**: Enable, add your OAuth consent screen details, and save

## Step 2: Get Firebase Configuration

1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" section
3. Click on the Web app icon (`</>`) or create a new web app
4. Copy the Firebase configuration object

It should look like:
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "gen-lang-client-0558617691.firebaseapp.com",
  projectId: "gen-lang-client-0558617691",
  storageBucket: "gen-lang-client-0558617691.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory with:

```env
# Firebase Configuration (as JSON string)
FIREBASE_CONFIG={"apiKey":"AIzaSy...","authDomain":"gen-lang-client-0558617691.firebaseapp.com","projectId":"gen-lang-client-0558617691","storageBucket":"gen-lang-client-0558617691.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abc123"}

# Or use individual variables (preferred)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Google OAuth Client ID (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Gemini API Key (for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

## Step 4: Configure Google OAuth

1. Go to Firebase Console → Authentication → Sign-in method → Google
2. Add authorized domains:
   - `localhost` (for development)
   - Your production domain (e.g., `gen-lang-client-0558617691.web.app`)
3. Copy the Web client ID and add it to `.env` as `GOOGLE_CLIENT_ID`

## Step 5: Set Up Firestore (Optional but Recommended)

1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Start in **test mode** (for development) or **production mode** (for production)
4. Choose a location (e.g., `us-central1`)

The app will automatically create user documents in the `users` collection.

## Step 6: Update Firebase Config File

The Firebase configuration is loaded from:
- Environment variable `FIREBASE_CONFIG` (JSON string), OR
- Individual environment variables (`VITE_FIREBASE_API_KEY`, etc.)

Update `config/firebase.ts` if you need to change the default project ID or configuration loading logic.

## Step 7: Test Authentication

1. Start the development server: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Try creating an account with email/password
4. Try signing in with Google (if configured)

## Demo Accounts

Demo accounts are still available and work alongside Firebase Auth:
- Email: `demo@ecotable.dev`
- Password: `password123`

Demo accounts use the local `AuthService` and don't require Firebase.

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure `FIREBASE_CONFIG` is set in your `.env` file
- Check that the config JSON is valid

### "Firebase: Error (auth/api-key-not-valid)"
- Verify your API key in Firebase Console → Project Settings
- Make sure you're using the correct project's API key

### Google Sign-In not working
- Verify `GOOGLE_CLIENT_ID` is set correctly
- Check that Google Sign-In is enabled in Firebase Console
- Ensure authorized domains are configured

### Firestore permission errors
- Check Firestore security rules
- For development, you can use test mode (allows read/write for 30 days)

## Security Rules (Firestore)

For production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Local Development with Emulators (Optional)

To use Firebase Emulators for local development:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Start emulators: `firebase emulators:start`
4. Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env`

## Deployment

For Cloud Build deployment, ensure these substitution variables are set:
- `_FIREBASE_CONFIG`: Your Firebase config JSON string
- `_GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `_FIREBASE_TOKEN`: Your Firebase CI token (for deployment)
