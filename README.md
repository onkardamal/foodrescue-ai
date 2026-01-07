<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SaveBite - AI-Powered Food Waste Reduction Platform

SaveBite is an AI-powered platform that helps reduce food waste by tracking inventory, generating recipes from expiring items, and connecting users with nearby NGOs for food donations.

View your app in AI Studio: https://ai.studio/apps/drive/1nMCDVBoP4B7-sdP41ECfdQ2Q-HU2id8w

## 🚀 Quick Start

### Run Locally

**Prerequisites:** Node.js 18+ and npm

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your API keys (see [Environment Variables](#environment-variables) below)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - App will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## 📦 Deployment

This app is configured for automatic deployment to **Firebase Hosting** using **Google Cloud Build**.

### Automatic Deployment (Recommended)

1. **Push to `main` branch** - Cloud Build automatically deploys
2. **Monitor builds** at [Cloud Build Console](https://console.cloud.google.com/cloud-build/builds)
3. **View deployed app** at: https://gen-lang-client-0558617691.web.app

### Setup Instructions

For detailed deployment setup, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

**Quick Setup:**
1. Generate Firebase token: `firebase login:ci`
2. Configure Cloud Build trigger with environment variables
3. Push to `main` branch

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | For AI features | Google Gemini API key for AI-powered features |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID for Google Sign-In |
| `FIREBASE_CONFIG` | Production | Firebase web app configuration (JSON string) |

See [.env.example](./.env.example) for the complete template.

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Routing:** React Router v7 (HashRouter)
- **Styling:** Tailwind CSS (CDN)
- **Maps:** Leaflet
- **Charts:** Recharts
- **Icons:** Lucide React
- **AI:** Google Gemini API
- **Backend:** Firebase (Auth, Firestore)
- **Hosting:** Firebase Hosting
- **CI/CD:** Google Cloud Build

## 📁 Project Structure

```
foodrescue-ai/
├── components/          # React components
│   ├── Auth.tsx        # Authentication (Login/Signup)
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Inventory.tsx   # Food inventory management
│   ├── Recipes.tsx     # AI-generated recipes
│   ├── Donation.tsx    # Food donation flow
│   └── ...
├── services/           # API services
│   ├── geminiService.ts    # Gemini AI integration
│   ├── auth.ts            # Authentication service
│   └── firebase.ts        # Firebase configuration
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── vite.config.ts      # Vite configuration
├── firebase.json       # Firebase hosting config
├── cloudbuild.yaml     # Cloud Build configuration
└── DEPLOYMENT.md       # Deployment guide
```

## 🎯 Features

- ✅ **Food Inventory Tracking** - Track expiry dates and food conditions
- ✅ **AI Image Analysis** - Scan food items and get expiry estimates
- ✅ **Smart Recipe Generation** - AI-powered recipes from expiring items
- ✅ **NGO Finder** - Find nearby food banks and donation centers
- ✅ **Gamification** - Points, badges, and leaderboard
- ✅ **Analytics Dashboard** - Track meals saved, CO2 reduced, money saved
- ✅ **Dark Mode** - Beautiful dark/light theme support
- ✅ **Responsive Design** - Works on mobile and desktop

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[.env.example](./.env.example)** - Environment variables template

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Testing

```bash
npm test  # Run Playwright tests (if configured)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is part of the AI Studio platform.

---

**Live App:** https://gen-lang-client-0558617691.web.app  
**Firebase Project:** gen-lang-client-0558617691  
**Region:** asia-south1 (Mumbai)

