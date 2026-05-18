# UVION Frontend - Setup & Installation Guide

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn
- Firebase account with project setup
- Git

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Firebase Configuration

You need to get your Firebase web configuration from Firebase Console:

**Steps:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project "uvion-21ac2"
3. Go to **Project Settings** (gear icon)
4. Scroll to "Your apps" section
5. Click on the web app (or create one if needed)
6. Copy the configuration

**Your Firebase config should look like:**

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "uvion-21ac2.firebaseapp.com",
  projectId: "uvion-21ac2",
  storageBucket: "uvion-21ac2.appspot.com",
  messagingSenderId: "114024258151721918309",
  appId: "1:114024258151721918309:web:abc123..."
}
```

### 3. Environment Setup

Create `.env.local` in the frontend folder with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_web_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=uvion-21ac2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=uvion-21ac2
VITE_FIREBASE_STORAGE_BUCKET=uvion-21ac2.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=114024258151721918309
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_API_BASE_URL=http://localhost:8000
VITE_WEATHER_API_KEY=471e453b31a60972d5a6f9309173be95
```

### 4. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── pages/              # Page components (Login, Signup, Setup)
├── components/         # Reusable components (ProtectedRoute, etc.)
├── contexts/          # Zustand stores (Auth state management)
├── services/          # API & Firebase services
├── types/             # TypeScript type definitions
├── styles/            # Global styles and theme
├── App.tsx            # Main App component with routing
└── main.tsx           # Entry point
```

## 🎨 Theme Colors

The app uses a **green agricultural theme**:

- **Primary**: `#10b981` (Emerald Green)
- **Secondary**: `#34d399` (Bright Green)
- **Accent**: `#6ee7b7` (Light Green)

All colors are defined in `src/styles/theme.ts`

## 🔐 Authentication Flow

1. **Signup**: User creates account → stored in Firebase Auth + Firestore
2. **Login**: User signs in → redirected to `/setup`
3. **Protected Route**: `/setup` requires authentication
4. **Auto-login**: App initializes auth on mount (persistent login)

## 📱 Pages

### 1. **Login Page** (`/login`)

- Email & password login
- "Forgot password" link (to be implemented)
- Link to signup
- Green theme with gradients

### 2. **Signup Page** (`/signup`)

- Create account with name, email, password
- Password strength indicator
- Terms & conditions checkbox
- Auto-login after signup

### 3. **Setup Page** (`/setup`)

- Protected route (requires authentication)
- Farm setup form (under development)
- Displays logged-in user info

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm build

# Preview production build
npm preview

# Lint code
npm lint
```

## 🚨 Common Issues

### Firebase config not found

**Error**: `Firebase configuration is incomplete`
**Fix**: Make sure `.env.local` has all Firebase credentials

### Port 5173 already in use

**Fix**: Change port in `vite.config.ts` or kill the process

### TypeScript errors

**Fix**: Make sure all imports use `@` path aliases from `tsconfig.json`

## 📚 Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Styling**: CSS (with CSS-in-JS support)
- **Charts**: Recharts (for future dashboard)

## ✅ Features Implemented

- ✅ TypeScript configuration
- ✅ Firebase Authentication (Signup/Login)
- ✅ Firestore integration
- ✅ Green-themed UI
- ✅ Responsive design (mobile + desktop)
- ✅ Protected routes
- ✅ Password strength indicator
- ✅ Error handling
- ✅ Auto-login persistence

## 🚧 Coming Soon

- Farm setup form
- Weather dashboard
- Growth analysis
- Disease detection
- Yield prediction
- AI chat assistant
- Performance analytics

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify Firebase credentials in `.env.local`
3. Make sure backend API is running on port 8000
4. Check network tab in DevTools for API calls

## 🔐 Security Notes

⚠️ **Important**: The private key you provided earlier should only be used in the backend (for admin operations), never in frontend code. Frontend uses public web API key.

After deployment, regenerate your Firebase keys for security!
