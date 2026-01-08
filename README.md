# SaveBite 🍃

<div align="center">
  <h3>The right choice before waste.</h3>
  <p>Turn your excess food into meals, not waste. Track inventory, donate to NGOs, and save the planet—one bite at a time.</p>
</div>

---

## 🚀 About SaveBite

**SaveBite** is a comprehensive food rescue and waste reduction platform designed to help households and businesses manage their food inventory effectively. By combining smart inventory tracking with AI-powered recipe suggestions and a seamless donation network, SaveBite empowers users to make sustainable choices.

Whether you're looking to cook a meal with ingredients you already have, or donate surplus food to local NGOs, SaveBite handles it all while gamifying the experience to keep you motivated.

## ✨ Key Features

### 📦 Smart Inventory
- **Visual Tracking**: Keep track of your food items with categories, quantities, and expiration dates.
- **Expiration Alerts**: Never let food go to waste with clear status indicators for items nearing expiry.
- **Easy Management**: Add, edit, and update the status of your items (Consumed, Donated, Wasted).

### 🍳 AI Chef & Recipes
- **Smart Suggestions**: Get recipe ideas based *specifically* on the ingredients currently in your inventory.
- **Zero-Waste Cooking**: Prioritizes recipes that use items closest to expiration.
- **Detailed Instructions**: Complete cooking guides with difficulty levels and timings.

### 🤝 Donation Network
- **NGO Map**: Find nearby NGOs and food banks using an interactive map.
- **Direct Donation**: Coordinate food drop-offs directly through the app.
- **Impact Tracking**: See exactly where your food goes and who it helps.

### 📊 Analytics & Gamification
- **Impact Dashboard**: Visualize your contribution—Meals Saved, CO2 Reduction, and Money Saved.
- **Leaderboard**: Compete with other "Eco Chefs" to see who can save the most.
- **Badges & Levels**: Earn XP and unlock badges like "Waste Warrior" or "Donation Hero" as you progress.
- **Profile Customization**: Manage your "Eco Chef" identity.

### 🔐 Secure & Accessible
- **Authentication**: Sign up securely using Google or Email/Password.
- **Dark Mode**: Fully supported dark theme for all pages.
- **Responsive Design**: Works perfectly on desktop and mobile devices.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Lucide React (Icons)
- **Maps**: Leaflet, React-Leaflet
- **Charts**: Recharts
- **Backend / Auth**: Firebase (Auth, Firestore)
- **AI Integration**: Google Gemini API (for smart scanning & recipes)

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/savebite.git
   cd savebite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   *(Note: Firebase configuration is handled in `config/firebase.ts`)*

4. **Run the application**
   ```bash
   npm run dev
   ```

## 🧪 Demo Account

Want to try it out without signing up? Use the built-in demo credentials:

- **Email**: `demo@ecotable.dev`
- **Password**: `password123`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ for a greener planet</p>
</div>
