import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Validate required configuration
const requiredFields = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
]

const missingFields = requiredFields.filter(field => !process.env[field])
if (missingFields.length > 0) {
  console.warn('Missing Firebase configuration fields:', missingFields)
}

// Initialize Firebase app (only if not already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Configure emulators for development (only in development environment)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only connect to emulators if we're in the browser and in development
  const isEmulatorConnected = (service: any) => {
    return service._delegate?._databaseId?.host?.includes('localhost') || 
           service.app?.automaticDataCollectionEnabled === false
  }

  // Connect Firestore emulator
  if (!isEmulatorConnected(db)) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080)
    } catch (error) {
      console.log('Firestore emulator connection failed (this is normal if not running):', error)
    }
  }

  // Connect Auth emulator
  if (!isEmulatorConnected(auth)) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    } catch (error) {
      console.log('Auth emulator connection failed (this is normal if not running):', error)
    }
  }

  // Connect Storage emulator
  if (!isEmulatorConnected(storage)) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199)
    } catch (error) {
      console.log('Storage emulator connection failed (this is normal if not running):', error)
    }
  }
}

export { app }
export default app