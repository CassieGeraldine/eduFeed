# Firebase Setup Guide for eduFeed

This guide will help you set up Firebase for your eduFeed project to store user data and rewards system.

## 🔥 Firebase Project Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `edufeed-app` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Wait for project creation to complete

### 2. Enable Firestore Database

1. In your Firebase console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to South Africa, e.g., `europe-west3`)
5. Click "Done"

### 3. Enable Authentication (Optional but Recommended)

1. Go to **Authentication** in the Firebase console
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable desired sign-in providers:
   - Email/Password
   - Google
   - Phone (useful for South African users)

### 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and select "Web" (</> icon)
4. Register your app with name: `eduFeed Web App`
5. Copy the configuration object

## 🔑 Environment Configuration

### Update your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Replace the placeholder values with your actual Firebase configuration values.

## 📊 Database Structure

### Collections Overview

The Firebase setup includes the following collections:

#### User Collections

- **`users`** - User profiles and basic information
- **`userPreferences`** - User settings and preferences
- **`userProgress`** - Learning progress and statistics
- **`userSocial`** - Social features (friends, groups, etc.)
- **`userCareerJourney`** - Career exploration and goals
- **`userActivities`** - Activity logs and history

#### Rewards Collections

- **`userRewards`** - User rewards summary (points, levels, etc.)
- **`pointsTransactions`** - Points earning and spending history
- **`badges`** - Available badges in the system
- **`userBadges`** - Badges earned by users
- **`achievements`** - Available achievements
- **`userAchievements`** - Achievement progress and completions
- **`storeItems`** - Rewards store items
- **`redemptions`** - User redemption history
- **`leaderboard`** - Leaderboard entries
- **`specialEvents`** - Special events and challenges
- **`userEventParticipation`** - User participation in events

## 🚀 Getting Started

### 1. Test Firebase Connection

Start your development server and test the Firebase connection:

```bash
npm run dev
# or
pnpm dev
```

Then visit: `http://localhost:3001/api/firebase-test`

You should see:

```json
{
  "success": true,
  "message": "Firebase connection successful",
  "timestamp": "2025-09-25T14:30:00.000Z"
}
```

### 2. Initialize Database with Default Data

Make a POST request to initialize the database:

```bash
curl -X POST http://localhost:3001/api/firebase-test \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

This will create:

- 6 default badges (First Steps, Scholar, Quiz Master, etc.)
- 5 default achievements (Rising Star, Academic Excellence, etc.)
- 7 default store items (data bundles, airtime, vouchers, etc.)

### 3. Usage Examples

#### Creating a User

```typescript
import { initializeCompleteUserData } from "@/lib/services/userService";
import { initializeUserRewards } from "@/lib/services/rewardsService";

const userData = {
  email: "student@example.com",
  displayName: "John Doe",
  firstName: "John",
  lastName: "Doe",
  accountType: "student",
  province: "Gauteng",
  city: "Johannesburg",
  school: "Example High School",
  grade: "Grade 10",
};

// Initialize complete user data
const completeUserData = await initializeCompleteUserData(userData);

// Initialize rewards
await initializeUserRewards(completeUserData.profile.uid);
```

#### Awarding Points

```typescript
import { awardPoints } from "@/lib/services/rewardsService";

// Award points for lesson completion
await awardPoints(
  "user-uid",
  10, // points
  "lesson_completion",
  "Completed Mathematics Lesson 1",
  "lesson-id-123"
);
```

#### Checking User Progress

```typescript
import { getUserProgress } from "@/lib/services/userService";
import { getUserRewards } from "@/lib/services/rewardsService";

const progress = await getUserProgress("user-uid");
const rewards = await getUserRewards("user-uid");

console.log(`Lessons completed: ${progress?.totalLessonsCompleted}`);
console.log(`Total points: ${rewards?.totalPoints}`);
```

## 🔒 Security Rules

For production, update your Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /userProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /userRewards/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public data (read-only for authenticated users)
    match /badges/{badgeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }

    match /achievements/{achievementId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }

    match /storeItems/{itemId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }

    // Leaderboards are public read
    match /leaderboard/{entry} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }
  }
}
```

## 🎯 South African Features

The system includes specific features for South Africa:

### Mobile Data & Airtime Rewards

- Vodacom, MTN, Cell C, Telkom data bundles
- Airtime vouchers for all networks
- Integration ready for South African payment gateways

### Educational Context

- South African provinces and cities
- Local school systems (Grade R - Grade 12)
- Multiple official languages support
- Career paths relevant to South African job market

### Localization

- Currency in South African Rand (ZAR)
- Province-based user profiling
- South African education system alignment

## 🔧 Development Tips

### Testing with Firebase Emulator (Optional)

For local development without affecting production data:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init` (select Firestore and Emulator)
4. Start emulator: `firebase emulators:start`
5. Update `.env.local` to use emulator:

```bash
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Monitoring and Analytics

1. Enable Analytics in Firebase Console
2. Monitor usage in the Analytics dashboard
3. Set up performance monitoring
4. Create custom events for learning milestones

## 📱 Next Steps

1. **Authentication Integration**: Add user registration and login
2. **Real-time Features**: Implement live leaderboards and notifications
3. **Mobile App**: Extend to React Native using the same Firebase setup
4. **Payment Integration**: Add South African payment gateways for premium features
5. **Advanced Analytics**: Track learning patterns and optimize content

## 🆘 Troubleshooting

### Common Issues

1. **"Firebase not initialized"**

   - Check environment variables are set correctly
   - Ensure Firebase config is valid

2. **"Permission denied"**

   - Update Firestore security rules
   - Check user authentication status

3. **"Collection not found"**

   - Run the database initialization POST request
   - Check collection names match exactly

4. **Network connection issues**
   - Verify Firebase project is active
   - Check internet connection
   - Try using Firebase emulator for local development

### Support

- Firebase Documentation: https://firebase.google.com/docs
- Firestore Guide: https://firebase.google.com/docs/firestore
- South African Firebase Community: Contact local Google Developer Groups

---

**Ready to start building with Firebase! 🚀**

Your eduFeed app now has a complete user and rewards system ready for South African students.
