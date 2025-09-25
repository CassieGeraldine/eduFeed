import { 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  writeBatch,
  increment,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  UserRewards,
  PointsTransaction,
  Badge,
  UserBadge,
  Achievement,
  UserAchievement,
  StoreItem,
  RedemptionRecord,
  LeaderboardEntry,
  SpecialEvent,
  UserEventParticipation,
  RewardContext,
  BulkRewardOperation,
  POINTS_CONFIG,
  XP_CONFIG
} from '@/lib/models/rewards'

// ==================== COLLECTION REFERENCES ====================

const COLLECTIONS = {
  USER_REWARDS: 'userRewards',
  POINTS_TRANSACTIONS: 'pointsTransactions',
  BADGES: 'badges',
  USER_BADGES: 'userBadges',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'userAchievements',
  STORE_ITEMS: 'storeItems',
  REDEMPTIONS: 'redemptions',
  LEADERBOARD: 'leaderboard',
  SPECIAL_EVENTS: 'specialEvents',
  USER_EVENT_PARTICIPATION: 'userEventParticipation'
} as const

// ==================== USER REWARDS OPERATIONS ====================

/**
 * Initialize user rewards data
 */
export async function initializeUserRewards(uid: string): Promise<UserRewards> {
  const userRewards: UserRewards = {
    uid,
    totalPoints: 0,
    availablePoints: 0,
    lifetimePointsEarned: 0,
    
    currentLevel: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXPEarned: 0,
    
    totalBadges: 0,
    totalAchievements: 0,
    
    currentStreak: 0,
    longestStreak: 0,
    
    totalRedemptions: 0,
    totalSpent: 0,
    
    updatedAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, COLLECTIONS.USER_REWARDS, uid), userRewards)
  return userRewards
}

/**
 * Get user rewards data
 */
export async function getUserRewards(uid: string): Promise<UserRewards | null> {
  try {
    const rewardsDoc = await getDoc(doc(db, COLLECTIONS.USER_REWARDS, uid))
    if (rewardsDoc.exists()) {
      return rewardsDoc.data() as UserRewards
    }
    return null
  } catch (error) {
    console.error('Error getting user rewards:', error)
    throw error
  }
}

/**
 * Award points to user
 */
export async function awardPoints(
  uid: string,
  points: number,
  source: PointsTransaction['source'],
  description: string,
  sourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    // Update user rewards
    const rewardsRef = doc(db, COLLECTIONS.USER_REWARDS, uid)
    batch.update(rewardsRef, {
      totalPoints: increment(points),
      availablePoints: increment(points),
      lifetimePointsEarned: increment(points),
      lastEarnedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create transaction record
    const transactionRef = doc(collection(db, COLLECTIONS.POINTS_TRANSACTIONS))
    const transaction: PointsTransaction = {
      id: transactionRef.id,
      uid,
      type: 'earned',
      amount: points,
      balance: 0, // Will be updated with actual balance after transaction
      source,
      sourceId,
      description,
      metadata,
      timestamp: serverTimestamp() as Timestamp
    }
    
    batch.set(transactionRef, transaction)
    
    await batch.commit()
  } catch (error) {
    console.error('Error awarding points:', error)
    throw error
  }
}

/**
 * Spend points
 */
export async function spendPoints(
  uid: string,
  points: number,
  source: PointsTransaction['source'],
  description: string,
  sourceId?: string
): Promise<boolean> {
  try {
    // First check if user has enough points
    const userRewards = await getUserRewards(uid)
    if (!userRewards || userRewards.availablePoints < points) {
      return false
    }

    const batch = writeBatch(db)
    
    // Update user rewards
    const rewardsRef = doc(db, COLLECTIONS.USER_REWARDS, uid)
    batch.update(rewardsRef, {
      availablePoints: increment(-points),
      totalSpent: increment(points),
      lastRedeemedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create transaction record
    const transactionRef = doc(collection(db, COLLECTIONS.POINTS_TRANSACTIONS))
    const transaction: PointsTransaction = {
      id: transactionRef.id,
      uid,
      type: 'spent',
      amount: -points,
      balance: userRewards.availablePoints - points,
      source,
      sourceId,
      description,
      timestamp: serverTimestamp() as Timestamp
    }
    
    batch.set(transactionRef, transaction)
    
    await batch.commit()
    return true
  } catch (error) {
    console.error('Error spending points:', error)
    throw error
  }
}

/**
 * Award XP to user
 */
export async function awardXP(uid: string, xp: number): Promise<boolean> {
  try {
    const userRewards = await getUserRewards(uid)
    if (!userRewards) {
      throw new Error('User rewards not found')
    }

    const newXP = userRewards.currentXP + xp
    const newTotalXP = userRewards.totalXPEarned + xp
    
    // Calculate level progression
    let newLevel = userRewards.currentLevel
    let remainingXP = newXP
    let leveledUp = false
    
    // Simple level calculation - each level requires 100 more XP than the previous
    while (remainingXP >= (newLevel * 100)) {
      remainingXP -= (newLevel * 100)
      newLevel++
      leveledUp = true
    }

    const xpToNextLevel = (newLevel * 100) - remainingXP

    // Update user rewards
    await updateDoc(doc(db, COLLECTIONS.USER_REWARDS, uid), {
      currentXP: remainingXP,
      currentLevel: newLevel,
      xpToNextLevel,
      totalXPEarned: newTotalXP,
      updatedAt: serverTimestamp()
    })

    // If user leveled up, award bonus points
    if (leveledUp) {
      await awardPoints(
        uid,
        50 * (newLevel - userRewards.currentLevel), // 50 points per level gained
        'admin_adjustment',
        `Level up bonus: Reached level ${newLevel}`,
        undefined,
        { previousLevel: userRewards.currentLevel, newLevel }
      )
    }

    return leveledUp
  } catch (error) {
    console.error('Error awarding XP:', error)
    throw error
  }
}

// ==================== BADGES OPERATIONS ====================

/**
 * Create a new badge
 */
export async function createBadge(badgeData: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const badgeRef = doc(collection(db, COLLECTIONS.BADGES))
    const badge: Badge = {
      ...badgeData,
      id: badgeRef.id,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(badgeRef, badge)
    return badgeRef.id
  } catch (error) {
    console.error('Error creating badge:', error)
    throw error
  }
}

/**
 * Get all badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  try {
    const badgesQuery = query(collection(db, COLLECTIONS.BADGES), where('isActive', '==', true))
    const querySnapshot = await getDocs(badgesQuery)
    return querySnapshot.docs.map(doc => doc.data() as Badge)
  } catch (error) {
    console.error('Error getting badges:', error)
    throw error
  }
}

/**
 * Award badge to user
 */
export async function awardBadge(uid: string, badgeId: string): Promise<void> {
  try {
    // Get badge details
    const badgeDoc = await getDoc(doc(db, COLLECTIONS.BADGES, badgeId))
    if (!badgeDoc.exists()) {
      throw new Error('Badge not found')
    }
    
    const badge = badgeDoc.data() as Badge
    
    // Check if user already has this badge
    const existingBadgeQuery = query(
      collection(db, COLLECTIONS.USER_BADGES),
      where('uid', '==', uid),
      where('badgeId', '==', badgeId)
    )
    const existingBadge = await getDocs(existingBadgeQuery)
    
    if (!existingBadge.empty) {
      console.log('User already has this badge')
      return
    }

    const batch = writeBatch(db)
    
    // Create user badge record
    const userBadgeRef = doc(collection(db, COLLECTIONS.USER_BADGES))
    const userBadge: UserBadge = {
      id: userBadgeRef.id,
      uid,
      badgeId,
      badgeName: badge.name,
      badgeIconUrl: badge.iconUrl,
      badgeRarity: badge.rarity,
      earnedAt: serverTimestamp() as Timestamp,
      progress: 100,
      isCompleted: true
    }
    
    batch.set(userBadgeRef, userBadge)
    
    // Update user rewards
    const rewardsRef = doc(db, COLLECTIONS.USER_REWARDS, uid)
    batch.update(rewardsRef, {
      totalBadges: increment(1),
      updatedAt: serverTimestamp()
    })
    
    await batch.commit()
    
    // Award points and XP for the badge
    await awardPoints(uid, badge.pointsReward, 'admin_adjustment', `Badge earned: ${badge.name}`, badgeId)
    await awardXP(uid, badge.xpReward)
  } catch (error) {
    console.error('Error awarding badge:', error)
    throw error
  }
}

/**
 * Get user badges
 */
export async function getUserBadges(uid: string): Promise<UserBadge[]> {
  try {
    const badgesQuery = query(
      collection(db, COLLECTIONS.USER_BADGES),
      where('uid', '==', uid),
      orderBy('earnedAt', 'desc')
    )
    const querySnapshot = await getDocs(badgesQuery)
    return querySnapshot.docs.map(doc => doc.data() as UserBadge)
  } catch (error) {
    console.error('Error getting user badges:', error)
    throw error
  }
}

// ==================== ACHIEVEMENTS OPERATIONS ====================

/**
 * Create a new achievement
 */
export async function createAchievement(achievementData: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const achievementRef = doc(collection(db, COLLECTIONS.ACHIEVEMENTS))
    const achievement: Achievement = {
      ...achievementData,
      id: achievementRef.id,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(achievementRef, achievement)
    return achievementRef.id
  } catch (error) {
    console.error('Error creating achievement:', error)
    throw error
  }
}

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const achievementsQuery = query(collection(db, COLLECTIONS.ACHIEVEMENTS), where('isActive', '==', true))
    const querySnapshot = await getDocs(achievementsQuery)
    return querySnapshot.docs.map(doc => doc.data() as Achievement)
  } catch (error) {
    console.error('Error getting achievements:', error)
    throw error
  }
}

/**
 * Get user achievements
 */
export async function getUserAchievements(uid: string): Promise<UserAchievement[]> {
  try {
    const achievementsQuery = query(
      collection(db, COLLECTIONS.USER_ACHIEVEMENTS),
      where('uid', '==', uid),
      orderBy('startedAt', 'desc')
    )
    const querySnapshot = await getDocs(achievementsQuery)
    return querySnapshot.docs.map(doc => doc.data() as UserAchievement)
  } catch (error) {
    console.error('Error getting user achievements:', error)
    throw error
  }
}

// ==================== STORE OPERATIONS ====================

/**
 * Get all store items
 */
export async function getStoreItems(category?: string): Promise<StoreItem[]> {
  try {
    let storeQuery = query(collection(db, COLLECTIONS.STORE_ITEMS), where('isAvailable', '==', true))
    
    if (category) {
      storeQuery = query(storeQuery, where('category', '==', category))
    }
    
    storeQuery = query(storeQuery, orderBy('pointsCost', 'asc'))
    
    const querySnapshot = await getDocs(storeQuery)
    return querySnapshot.docs.map(doc => doc.data() as StoreItem)
  } catch (error) {
    console.error('Error getting store items:', error)
    throw error
  }
}

/**
 * Create store item
 */
export async function createStoreItem(itemData: Omit<StoreItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const itemRef = doc(collection(db, COLLECTIONS.STORE_ITEMS))
    const storeItem: StoreItem = {
      ...itemData,
      id: itemRef.id,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(itemRef, storeItem)
    return itemRef.id
  } catch (error) {
    console.error('Error creating store item:', error)
    throw error
  }
}

/**
 * Redeem store item
 */
export async function redeemStoreItem(
  uid: string,
  itemId: string,
  deliveryDetails?: RedemptionRecord['deliveryDetails']
): Promise<string | null> {
  try {
    // Get store item
    const itemDoc = await getDoc(doc(db, COLLECTIONS.STORE_ITEMS, itemId))
    if (!itemDoc.exists()) {
      throw new Error('Store item not found')
    }
    
    const storeItem = itemDoc.data() as StoreItem
    
    // Check if user has enough points
    const success = await spendPoints(
      uid,
      storeItem.pointsCost,
      'redemption',
      `Redeemed: ${storeItem.name}`,
      itemId
    )
    
    if (!success) {
      return null // Not enough points
    }

    // Create redemption record
    const redemptionRef = doc(collection(db, COLLECTIONS.REDEMPTIONS))
    const redemption: RedemptionRecord = {
      id: redemptionRef.id,
      uid,
      storeItemId: itemId,
      itemName: storeItem.name,
      itemCategory: storeItem.category,
      pointsSpent: storeItem.pointsCost,
      cashValue: storeItem.cashValue,
      status: 'pending',
      deliveryMethod: storeItem.category === 'digital' ? 'digital' : 'email',
      deliveryDetails,
      isDelivered: false,
      retryCount: 0,
      redeemedAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(redemptionRef, redemption)
    
    // Update user rewards redemption count
    await updateDoc(doc(db, COLLECTIONS.USER_REWARDS, uid), {
      totalRedemptions: increment(1),
      updatedAt: serverTimestamp()
    })
    
    return redemptionRef.id
  } catch (error) {
    console.error('Error redeeming store item:', error)
    throw error
  }
}

/**
 * Get user redemptions
 */
export async function getUserRedemptions(uid: string): Promise<RedemptionRecord[]> {
  try {
    const redemptionsQuery = query(
      collection(db, COLLECTIONS.REDEMPTIONS),
      where('uid', '==', uid),
      orderBy('redeemedAt', 'desc')
    )
    const querySnapshot = await getDocs(redemptionsQuery)
    return querySnapshot.docs.map(doc => doc.data() as RedemptionRecord)
  } catch (error) {
    console.error('Error getting user redemptions:', error)
    throw error
  }
}

// ==================== LEADERBOARD OPERATIONS ====================

/**
 * Update user leaderboard entry
 */
export async function updateLeaderboardEntry(
  uid: string, 
  displayName: string,
  photoURL?: string,
  school?: string,
  grade?: string
): Promise<void> {
  try {
    const userRewards = await getUserRewards(uid)
    if (!userRewards) return

    const leaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, uid)
    const leaderboardEntry: Partial<LeaderboardEntry> = {
      uid,
      displayName,
      photoURL,
      school,
      grade,
      totalPoints: userRewards.totalPoints,
      totalXP: userRewards.totalXPEarned,
      streakDays: userRewards.currentStreak,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(leaderboardRef, leaderboardEntry, { merge: true })
  } catch (error) {
    console.error('Error updating leaderboard entry:', error)
    throw error
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'all_time', limitCount: number = 100): Promise<LeaderboardEntry[]> {
  try {
    const orderField = period === 'all_time' ? 'totalPoints' : 
                      period === 'weekly' ? 'weeklyPoints' : 'monthlyPoints'
    
    const leaderboardQuery = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy(orderField, 'desc'),
      limit(limitCount)
    )
    
    const querySnapshot = await getDocs(leaderboardQuery)
    return querySnapshot.docs.map((doc, index) => ({
      ...doc.data() as LeaderboardEntry,
      rank: index + 1
    }))
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    throw error
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Process lesson completion rewards
 */
export async function processLessonCompletionRewards(
  uid: string,
  lessonId: string,
  timeSpent: number,
  score?: number
): Promise<void> {
  try {
    let points = POINTS_CONFIG.LESSON_COMPLETION
    let xp = XP_CONFIG.LESSON_COMPLETION
    
    // Bonus for perfect score
    if (score && score >= 100) {
      points += POINTS_CONFIG.QUIZ_PERFECT - POINTS_CONFIG.QUIZ_PASS
      xp += XP_CONFIG.QUIZ_PERFECT - XP_CONFIG.QUIZ_PASS
    }
    
    // Award points and XP
    await Promise.all([
      awardPoints(uid, points, 'lesson_completion', `Completed lesson: ${lessonId}`, lessonId),
      awardXP(uid, xp)
    ])
  } catch (error) {
    console.error('Error processing lesson completion rewards:', error)
    throw error
  }
}

/**
 * Process module completion rewards - enhanced version for skill points
 */
export async function processModuleCompletionRewards(
  uid: string,
  moduleId: string,
  subjectId: string,
  lessonsCompleted: number,
  averageScore: number,
  totalTimeSpent: number,
  skillsGained?: string[]
): Promise<{
  pointsAwarded: number
  xpAwarded: number
  badgesEarned: string[]
  levelUp: boolean
  newLevel?: number
}> {
  try {
    let totalPoints = 0
    let totalXP = 0
    const badgesEarned: string[] = []
    let levelUp = false
    let newLevel: number | undefined

    // Base points for module completion
    const basePoints = lessonsCompleted * POINTS_CONFIG.LESSON_COMPLETION
    const baseXP = lessonsCompleted * XP_CONFIG.LESSON_COMPLETION
    
    // Bonus points based on average score
    let scoreBonus = 0
    let xpBonus = 0
    if (averageScore >= 90) {
      scoreBonus = Math.floor(basePoints * 0.5) // 50% bonus for excellent performance
      xpBonus = Math.floor(baseXP * 0.5)
    } else if (averageScore >= 80) {
      scoreBonus = Math.floor(basePoints * 0.3) // 30% bonus for good performance
      xpBonus = Math.floor(baseXP * 0.3)
    } else if (averageScore >= 70) {
      scoreBonus = Math.floor(basePoints * 0.1) // 10% bonus for satisfactory performance
      xpBonus = Math.floor(baseXP * 0.1)
    }

    // Time-based bonus (for consistent study habits)
    const timeBonus = Math.min(Math.floor(totalTimeSpent / 60) * 5, 50) // 5 points per hour, max 50

    // Skills bonus
    const skillsBonus = (skillsGained?.length || 0) * 25 // 25 points per skill mastered

    totalPoints = basePoints + scoreBonus + timeBonus + skillsBonus
    totalXP = baseXP + xpBonus + Math.floor(timeBonus / 2) + (skillsGained?.length || 0) * 15

    // Award points and XP
    await Promise.all([
      awardPoints(uid, totalPoints, 'module_completion', `Completed module: ${moduleId} in ${subjectId}`, moduleId),
      awardXP(uid, totalXP)
    ])

    // Check for potential badge awards
    const userRewards = await getUserRewards(uid)
    if (userRewards) {
      // Module completion badge
      if (userRewards.totalPoints >= 1000 && !await hasUserBadge(uid, 'scholar-badge')) {
        await awardBadge(uid, 'scholar-badge')
        badgesEarned.push('scholar-badge')
      }

      // Subject specific badges
      if (averageScore >= 95 && !await hasUserBadge(uid, 'perfectionist-badge')) {
        await awardBadge(uid, 'perfectionist-badge')
        badgesEarned.push('perfectionist-badge')
      }

      // Check for level up
      const currentLevel = userRewards.currentLevel
      const newLevelCheck = calculateLevelFromXP(userRewards.totalXPEarned + totalXP)
      if (newLevelCheck > currentLevel) {
        levelUp = true
        newLevel = newLevelCheck
        
        // Level up bonus
        const levelUpBonus = 100 * newLevelCheck
        await awardPoints(uid, levelUpBonus, 'level_up', `Reached level ${newLevelCheck}!`)
      }
    }

    return {
      pointsAwarded: totalPoints,
      xpAwarded: totalXP,
      badgesEarned,
      levelUp,
      newLevel
    }

  } catch (error) {
    console.error('Error processing module completion rewards:', error)
    throw error
  }
}

/**
 * Calculate level from total XP
 */
function calculateLevelFromXP(totalXP: number): number {
  const LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7250, 9250,
    11500, 14000, 16750, 19750, 23000, 26500, 30250, 34250, 38500, 43000
  ]
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Check if user has a specific badge
 */
async function hasUserBadge(uid: string, badgeId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_BADGES),
      where('uid', '==', uid),
      where('badgeId', '==', badgeId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('Error checking user badge:', error)
    return false
  }
}

/**
 * Get user points balance
 */
export async function getUserPointsBalance(uid: string): Promise<number> {
  try {
    const rewardsDoc = await getDoc(doc(db, COLLECTIONS.USER_REWARDS, uid))
    if (!rewardsDoc.exists()) {
      return 0
    }
    return rewardsDoc.data().availablePoints || 0
  } catch (error) {
    console.error('Error getting user points balance:', error)
    return 0
  }
}

/**
 * Subscribe to user rewards changes
 */
export function subscribeToUserRewards(uid: string, callback: (rewards: UserRewards | null) => void) {
  return onSnapshot(doc(db, COLLECTIONS.USER_REWARDS, uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserRewards)
    } else {
      callback(null)
    }
  })
}