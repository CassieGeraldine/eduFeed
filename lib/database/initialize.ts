import { db } from '@/lib/firebase'
import { collection, doc, setDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore'
import { Badge, Achievement, StoreItem } from '@/lib/models/rewards'

// ==================== INITIAL DATA SETUP ====================

/**
 * Initialize default badges
 */
const defaultBadges: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Learning Badges
  {
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'learning',
    iconUrl: '/badges/first-steps.png',
    color: '#4CAF50',
    rarity: 'common',
    requirements: [
      { type: 'lesson_count', value: 1, condition: 'greater_than' }
    ],
    isSecret: false,
    pointsReward: 50,
    xpReward: 100,
    isActive: true,
    isLimited: false
  },
  {
    name: 'Scholar',
    description: 'Complete 10 lessons',
    category: 'learning',
    iconUrl: '/badges/scholar.png',
    color: '#2196F3',
    rarity: 'uncommon',
    requirements: [
      { type: 'lesson_count', value: 10, condition: 'greater_than' }
    ],
    isSecret: false,
    pointsReward: 100,
    xpReward: 200,
    isActive: true,
    isLimited: false
  },
  {
    name: 'Quiz Master',
    description: 'Pass 5 quizzes with perfect scores',
    category: 'achievement',
    iconUrl: '/badges/quiz-master.png',
    color: '#FF9800',
    rarity: 'rare',
    requirements: [
      { type: 'perfect_quizzes', value: 5, condition: 'greater_than' }
    ],
    isSecret: false,
    pointsReward: 200,
    xpReward: 400,
    isActive: true,
    isLimited: false
  },
  {
    name: 'Streak Warrior',
    description: 'Maintain a 7-day learning streak',
    category: 'achievement',
    iconUrl: '/badges/streak-warrior.png',
    color: '#E91E63',
    rarity: 'rare',
    requirements: [
      { type: 'streak_days', value: 7, condition: 'greater_than' }
    ],
    isSecret: false,
    pointsReward: 150,
    xpReward: 300,
    isActive: true,
    isLimited: false
  },
  {
    name: 'Career Explorer',
    description: 'Explore 5 different career paths',
    category: 'career',
    iconUrl: '/badges/career-explorer.png',
    color: '#9C27B0',
    rarity: 'uncommon',
    requirements: [
      { type: 'career_exploration', value: 5, condition: 'greater_than' }
    ],
    isSecret: false,
    pointsReward: 100,
    xpReward: 200,
    isActive: true,
    isLimited: false
  },
  {
    name: 'Time Master',
    description: 'Spend 10 hours learning',
    category: 'learning',
    iconUrl: '/badges/time-master.png',
    color: '#607D8B',
    rarity: 'epic',
    requirements: [
      { type: 'time_spent', value: 600, condition: 'greater_than' } // 600 minutes = 10 hours
    ],
    isSecret: false,
    pointsReward: 300,
    xpReward: 500,
    isActive: true,
    isLimited: false
  }
]

/**
 * Initialize default achievements
 */
const defaultAchievements: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Rising Star',
    description: 'Complete 5 lessons and pass 3 quizzes',
    category: 'academic',
    difficulty: 'easy',
    pointsReward: 100,
    xpReward: 200,
    requirements: [
      { type: 'complete_lessons', target: 5, timeframe: 'lifetime' },
      { type: 'pass_quizzes', target: 3, timeframe: 'lifetime' }
    ],
    iconUrl: '/achievements/rising-star.png',
    isActive: true,
    isHidden: false
  },
  {
    title: 'Academic Excellence',
    description: 'Achieve perfect scores on 10 quizzes',
    category: 'academic',
    difficulty: 'hard',
    pointsReward: 500,
    xpReward: 1000,
    badgeReward: 'quiz-master-badge-id',
    requirements: [
      { type: 'perfect_scores', target: 10, timeframe: 'lifetime' }
    ],
    iconUrl: '/achievements/academic-excellence.png',
    isActive: true,
    isHidden: false
  },
  {
    title: 'Consistency Champion',
    description: 'Maintain a 30-day learning streak',
    category: 'personal',
    difficulty: 'expert',
    pointsReward: 1000,
    xpReward: 2000,
    requirements: [
      { type: 'maintain_streak', target: 30, timeframe: 'lifetime' }
    ],
    iconUrl: '/achievements/consistency-champion.png',
    isActive: true,
    isHidden: false
  },
  {
    title: 'Point Collector',
    description: 'Earn 1000 points',
    category: 'personal',
    difficulty: 'medium',
    pointsReward: 200,
    xpReward: 400,
    requirements: [
      { type: 'earn_points', target: 1000, timeframe: 'lifetime' }
    ],
    iconUrl: '/achievements/point-collector.png',
    isActive: true,
    isHidden: false
  },
  {
    title: 'Dream Chaser',
    description: 'Explore your dream career and generate a professional image',
    category: 'career',
    difficulty: 'medium',
    pointsReward: 300,
    xpReward: 500,
    requirements: [
      { type: 'explore_careers', target: 1, timeframe: 'lifetime' }
    ],
    iconUrl: '/achievements/dream-chaser.png',
    isActive: true,
    isHidden: false
  }
]

/**
 * Initialize default store items (South Africa focused)
 */
const defaultStoreItems: Omit<StoreItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Mobile Data Bundles
  {
    name: 'Vodacom 1GB Data Bundle',
    description: '1GB data bundle for Vodacom networks',
    category: 'mobile_data',
    pointsCost: 500,
    cashValue: 50, // R50
    isAvailable: true,
    isLimited: false,
    imageUrl: '/store/vodacom-data.png',
    thumbnailUrl: '/store/vodacom-data-thumb.png',
    itemType: 'data_bundle',
    itemData: {
      dataAmount: '1GB',
      validityPeriod: '30 days',
      network: 'Vodacom'
    },
    provider: 'vodacom'
  },
  {
    name: 'MTN 2GB Data Bundle',
    description: '2GB data bundle for MTN networks',
    category: 'mobile_data',
    pointsCost: 800,
    cashValue: 80, // R80
    isAvailable: true,
    isLimited: false,
    imageUrl: '/store/mtn-data.png',
    thumbnailUrl: '/store/mtn-data-thumb.png',
    itemType: 'data_bundle',
    itemData: {
      dataAmount: '2GB',
      validityPeriod: '30 days',
      network: 'MTN'
    },
    provider: 'mtn'
  },
  
  // Airtime
  {
    name: 'R20 Airtime (Any Network)',
    description: 'R20 airtime voucher for any South African network',
    category: 'digital',
    pointsCost: 400,
    cashValue: 20,
    isAvailable: true,
    isLimited: false,
    imageUrl: '/store/airtime-20.png',
    thumbnailUrl: '/store/airtime-20-thumb.png',
    itemType: 'airtime',
    itemData: {
      amount: 20,
      currency: 'ZAR',
      networks: ['Vodacom', 'MTN', 'Cell C', 'Telkom']
    },
    provider: 'other'
  },
  {
    name: 'R50 Airtime (Any Network)',
    description: 'R50 airtime voucher for any South African network',
    category: 'digital',
    pointsCost: 1000,
    cashValue: 50,
    isAvailable: true,
    isLimited: false,
    imageUrl: '/store/airtime-50.png',
    thumbnailUrl: '/store/airtime-50-thumb.png',
    itemType: 'airtime',
    itemData: {
      amount: 50,
      currency: 'ZAR',
      networks: ['Vodacom', 'MTN', 'Cell C', 'Telkom']
    },
    provider: 'other'
  },
  
  // Educational Content
  {
    name: 'Premium Lesson Access (1 Month)',
    description: 'Unlock premium lessons and advanced content for 1 month',
    category: 'educational',
    pointsCost: 1500,
    cashValue: 100,
    isAvailable: true,
    isLimited: false,
    imageUrl: '/store/premium-access.png',
    thumbnailUrl: '/store/premium-access-thumb.png',
    itemType: 'course_access',
    itemData: {
      duration: '30 days',
      accessLevel: 'premium',
      subjects: 'all'
    }
  },
  
  // Physical Rewards
  {
    name: 'EduFeed T-Shirt',
    description: 'Stylish EduFeed branded t-shirt - show your learning pride!',
    category: 'physical',
    pointsCost: 2500,
    cashValue: 250,
    imageUrl: '/store/edufeed-tshirt.png',
    thumbnailUrl: '/store/edufeed-tshirt-thumb.png',
    isAvailable: true,
    isLimited: false,
    itemType: 'merchandise',
    itemData: {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Blue', 'Black', 'White'],
      material: 'Cotton blend'
    }
  },
  
  // Vouchers
  {
    name: 'Takealot R100 Voucher',
    description: 'R100 shopping voucher for Takealot.com',
    category: 'digital',
    pointsCost: 2500,
    cashValue: 100,
    isAvailable: true,
    stockQuantity: 50,
    isLimited: true,
    minimumLevel: 10,
    imageUrl: '/store/takealot-voucher.png',
    thumbnailUrl: '/store/takealot-voucher-thumb.png',
    itemType: 'voucher',
    itemData: {
      retailer: 'Takealot',
      validityPeriod: '6 months',
      termsUrl: 'https://takealot.com/terms'
    }
  }
]

// ==================== HELPER FUNCTIONS ====================

/**
 * Clean object by removing undefined values (Firebase doesn't support undefined)
 */
function cleanObject<T extends Record<string, any>>(obj: T): any {
  const cleaned: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value.seconds !== 'number') {
        // Recursively clean nested objects (but not Timestamps)
        cleaned[key] = cleanObject(value)
      } else {
        cleaned[key] = value
      }
    }
  }
  
  return cleaned
}

// ==================== INITIALIZATION FUNCTIONS ====================

/**
 * Initialize default badges in the database
 */
export async function initializeDefaultBadges(): Promise<void> {
  try {
    console.log('Initializing default badges...')
    
    const batch = writeBatch(db)
    
    for (const badgeData of defaultBadges) {
      const badgeRef = doc(collection(db, 'badges'))
      const badge: Badge = {
        ...badgeData,
        id: badgeRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }
      batch.set(badgeRef, cleanObject(badge))
    }
    
    await batch.commit()
    console.log(`Initialized ${defaultBadges.length} default badges`)
  } catch (error) {
    console.error('Error initializing default badges:', error)
    throw error
  }
}

/**
 * Initialize default achievements in the database
 */
export async function initializeDefaultAchievements(): Promise<void> {
  try {
    console.log('Initializing default achievements...')
    
    const batch = writeBatch(db)
    
    for (const achievementData of defaultAchievements) {
      const achievementRef = doc(collection(db, 'achievements'))
      const achievement: Achievement = {
        ...achievementData,
        id: achievementRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }
      batch.set(achievementRef, cleanObject(achievement))
    }
    
    await batch.commit()
    console.log(`Initialized ${defaultAchievements.length} default achievements`)
  } catch (error) {
    console.error('Error initializing default achievements:', error)
    throw error
  }
}

/**
 * Initialize default store items in the database
 */
export async function initializeDefaultStoreItems(): Promise<void> {
  try {
    console.log('Initializing default store items...')
    
    const batch = writeBatch(db)
    
    for (const itemData of defaultStoreItems) {
      const itemRef = doc(collection(db, 'storeItems'))
      const storeItem: StoreItem = {
        ...itemData,
        id: itemRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }
      batch.set(itemRef, cleanObject(storeItem))
    }
    
    await batch.commit()
    console.log(`Initialized ${defaultStoreItems.length} default store items`)
  } catch (error) {
    console.error('Error initializing default store items:', error)
    throw error
  }
}

/**
 * Initialize all default data
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Starting database initialization...')
    
    await Promise.all([
      initializeDefaultBadges(),
      initializeDefaultAchievements(),
      initializeDefaultStoreItems()
    ])
    
    console.log('Database initialization completed successfully!')
  } catch (error) {
    console.error('Error during database initialization:', error)
    throw error
  }
}

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('Testing Firebase connection...')
    
    // Try to write a test document
    const testRef = doc(db, 'test', 'connection')
    await setDoc(testRef, cleanObject({
      message: 'Firebase connection test',
      timestamp: serverTimestamp()
    }))
    
    console.log('Firebase connection successful!')
    return true
  } catch (error) {
    console.error('Firebase connection failed:', error)
    return false
  }
}

// ==================== DEVELOPMENT HELPERS ====================

/**
 * Reset database (USE WITH CAUTION - DEVELOPMENT ONLY)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Database reset is only allowed in development environment')
  }
  
  console.warn('RESETTING DATABASE - THIS WILL DELETE ALL DATA!')
  
  // This is a simplified version - in a real scenario, you'd need to
  // iterate through collections and delete documents
  // For now, we'll just reinitialize the default data
  await initializeDatabase()
}

/**
 * Create sample user data for testing
 */
export async function createSampleUserData(uid: string): Promise<void> {
  try {
    const { initializeCompleteUserData } = await import('@/lib/services/userService')
    const { initializeUserRewards } = await import('@/lib/services/rewardsService')
    
    const sampleUserData = {
      email: `test-user-${uid}@example.com`,
      displayName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      accountType: 'student' as const,
      province: 'Gauteng',
      city: 'Johannesburg',
      school: 'Test High School',
      grade: 'Grade 10'
    }
    
    await initializeCompleteUserData(sampleUserData)
    await initializeUserRewards(uid)
    
    console.log(`Created sample user data for UID: ${uid}`)
  } catch (error) {
    console.error('Error creating sample user data:', error)
    throw error
  }
}

// ==================== EXPORT UTILITY FUNCTIONS ====================

export {
  defaultBadges,
  defaultAchievements,
  defaultStoreItems
}