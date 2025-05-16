# 🔧 Project Setup Instructions

## 1. Firebase Configuration

Create a `.env.local` file in the root of your project and add the following:

# Firebase Configuration  
NEXT_PUBLIC_FIREBASE_API_KEY=  
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=  
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=  
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=  
NEXT_PUBLIC_FIREBASE_APP_ID=

## 2. MongoDB Configuration

Open `server/index.js` and replace the placeholder MongoDB URI with your own:

const MONGODB_URI = 'your-mongodb-url';

