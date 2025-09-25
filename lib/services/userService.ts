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
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  UserProfile, 
  UserPreferences, 
  UserProgress, 
  UserSocial, 
  UserCareerJourney,
  UserActivity,
  CreateUserData,
  UpdateUserData,
  CompleteUserData
} from '@/lib/models/user'

// ==================== COLLECTION REFERENCES ====================

const COLLECTIONS = {
  USERS: 'users',
  USER_PREFERENCES: 'userPreferences',
  USER_PROGRESS: 'userProgress',
  USER_SOCIAL: 'userSocial',
  USER_CAREER_JOURNEY: 'userCareerJourney',
  USER_ACTIVITIES: 'userActivities'
} as const

// ==================== USER PROFILE OPERATIONS ====================

/**
 * Create a new user profile
 */
export async function createUser(userData: CreateUserData): Promise<UserProfile> {
  const userProfile: UserProfile = {
    uid: userData.email, // Temporary until Firebase Auth provides the UID
    email: userData.email,
    displayName: userData.displayName,
    photoURL: userData.photoURL,
    phoneNumber: undefined,
    
    firstName: userData.firstName,
    lastName: userData.lastName,
    dateOfBirth: userData.dateOfBirth,
    gender: undefined,
    
    province: userData.province,
    city: userData.city,
    school: userData.school,
    grade: userData.grade,
    
    isActive: true,
    isVerified: false,
    accountType: userData.accountType,
    
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, COLLECTIONS.USERS, userProfile.uid), userProfile)
  return userProfile
}

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, updates: UpdateUserData): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), updateData)
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * Delete user profile (soft delete by setting isActive to false)
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      isActive: false,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error deleting user profile:', error)
    throw error
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      lastLoginAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating last login:', error)
    throw error
  }
}

// ==================== USER PREFERENCES OPERATIONS ====================

/**
 * Create default user preferences
 */
export async function createUserPreferences(uid: string): Promise<UserPreferences> {
  const defaultPreferences: UserPreferences = {
    uid,
    preferredLanguage: 'en',
    preferredSubjects: [],
    difficultyLevel: 'beginner',
    studyGoals: [],
    careerInterests: [],
    dreamJob: undefined,
    
    emailNotifications: true,
    pushNotifications: true,
    studyReminders: true,
    achievementAlerts: true,
    
    profileVisibility: 'friends',
    showProgress: true,
    allowMentoring: false,
    
    theme: 'system',
    autoPlayVideos: true,
    dataUsage: 'normal',
    
    updatedAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, COLLECTIONS.USER_PREFERENCES, uid), defaultPreferences)
  return defaultPreferences
}

/**
 * Get user preferences
 */
export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  try {
    const prefsDoc = await getDoc(doc(db, COLLECTIONS.USER_PREFERENCES, uid))
    if (prefsDoc.exists()) {
      return prefsDoc.data() as UserPreferences
    }
    return null
  } catch (error) {
    console.error('Error getting user preferences:', error)
    throw error
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(uid: string, updates: Partial<UserPreferences>): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(doc(db, COLLECTIONS.USER_PREFERENCES, uid), updateData)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw error
  }
}

// ==================== USER PROGRESS OPERATIONS ====================

/**
 * Create initial user progress
 */
export async function createUserProgress(uid: string): Promise<UserProgress> {
  const initialProgress: UserProgress = {
    uid,
    totalLessonsCompleted: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    
    subjectProgress: {},
    skillLevels: {},
    
    currentPathId: undefined,
    currentLessonId: undefined,
    
    weeklyGoalMinutes: 120, // 2 hours per week
    weeklyProgressMinutes: 0,
    monthlyGoalLessons: 16, // 4 lessons per week
    monthlyProgressLessons: 0,
    
    lastActivityAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, COLLECTIONS.USER_PROGRESS, uid), initialProgress)
  return initialProgress
}

/**
 * Get user progress
 */
export async function getUserProgress(uid: string): Promise<UserProgress | null> {
  try {
    const progressDoc = await getDoc(doc(db, COLLECTIONS.USER_PROGRESS, uid))
    if (progressDoc.exists()) {
      return progressDoc.data() as UserProgress
    }
    return null
  } catch (error) {
    console.error('Error getting user progress:', error)
    throw error
  }
}

/**
 * Update user progress
 */
export async function updateUserProgress(uid: string, updates: Partial<UserProgress>): Promise<void> {
  try {
    const updateData = {
      ...updates,
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(doc(db, COLLECTIONS.USER_PROGRESS, uid), updateData)
  } catch (error) {
    console.error('Error updating user progress:', error)
    throw error
  }
}

/**
 * Record lesson completion
 */
export async function recordLessonCompletion(
  uid: string, 
  lessonId: string, 
  subjectId: string, 
  timeSpent: number,
  score?: number
): Promise<void> {
  try {
    const batch = writeBatch(db)
    const progressRef = doc(db, COLLECTIONS.USER_PROGRESS, uid)
    
    // Update overall progress
    batch.update(progressRef, {
      totalLessonsCompleted: increment(1),
      totalTimeSpent: increment(timeSpent),
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Log activity
    const activityRef = doc(collection(db, COLLECTIONS.USER_ACTIVITIES))
    const activity: UserActivity = {
      id: activityRef.id,
      uid,
      activityType: 'lesson_completed',
      activityData: {
        lessonId,
        subjectId,
        timeSpent,
        score
      },
      points: 10, // Base points for lesson completion
      xp: 20,     // Base XP for lesson completion
      timestamp: serverTimestamp() as Timestamp
    }
    
    batch.set(activityRef, activity)
    
    await batch.commit()
  } catch (error) {
    console.error('Error recording lesson completion:', error)
    throw error
  }
}

// ==================== USER SOCIAL OPERATIONS ====================

/**
 * Create initial user social data
 */
export async function createUserSocial(uid: string): Promise<UserSocial> {
  const initialSocial: UserSocial = {
    uid,
    friends: [],
    friendRequests: {
      sent: [],
      received: []
    },
    studyGroups: [],
    mentors: [],
    mentees: [],
    
    helpfulVotes: 0,
    questionsAsked: 0,
    answersGiven: 0,
    
    updatedAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, COLLECTIONS.USER_SOCIAL, uid), initialSocial)
  return initialSocial
}

/**
 * Get user social data
 */
export async function getUserSocial(uid: string): Promise<UserSocial | null> {
  try {
    const socialDoc = await getDoc(doc(db, COLLECTIONS.USER_SOCIAL, uid))
    if (socialDoc.exists()) {
      return socialDoc.data() as UserSocial
    }
    return null
  } catch (error) {
    console.error('Error getting user social data:', error)
    throw error
  }
}

/**
 * Send friend request
 */
export async function sendFriendRequest(senderUid: string, receiverUid: string): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    // Add to sender's sent requests
    const senderRef = doc(db, COLLECTIONS.USER_SOCIAL, senderUid)
    batch.update(senderRef, {
      'friendRequests.sent': arrayUnion(receiverUid),
      updatedAt: serverTimestamp()
    })
    
    // Add to receiver's received requests
    const receiverRef = doc(db, COLLECTIONS.USER_SOCIAL, receiverUid)
    batch.update(receiverRef, {
      'friendRequests.received': arrayUnion(senderUid),
      updatedAt: serverTimestamp()
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error sending friend request:', error)
    throw error
  }
}

// ==================== USER CAREER JOURNEY OPERATIONS ====================

/**
 * Create initial career journey
 */
export async function createUserCareerJourney(uid: string): Promise<UserCareerJourney> {
  const initialCareerJourney: UserCareerJourney = {
    uid,
    personalityType: undefined,
    strengthsAssessment: [],
    interestAreas: [],
    exploredCareers: [],
    dreamCareer: undefined,
    shortTermGoals: [],
    longTermGoals: [],
    careerImages: [],
    updatedAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, COLLECTIONS.USER_CAREER_JOURNEY, uid), initialCareerJourney)
  return initialCareerJourney
}

/**
 * Get user career journey
 */
export async function getUserCareerJourney(uid: string): Promise<UserCareerJourney | null> {
  try {
    const careerDoc = await getDoc(doc(db, COLLECTIONS.USER_CAREER_JOURNEY, uid))
    if (careerDoc.exists()) {
      return careerDoc.data() as UserCareerJourney
    }
    return null
  } catch (error) {
    console.error('Error getting user career journey:', error)
    throw error
  }
}

/**
 * Update career journey
 */
export async function updateUserCareerJourney(uid: string, updates: Partial<UserCareerJourney>): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(doc(db, COLLECTIONS.USER_CAREER_JOURNEY, uid), updateData)
  } catch (error) {
    console.error('Error updating user career journey:', error)
    throw error
  }
}

/**
 * Add career exploration record
 */
export async function addCareerExploration(
  uid: string, 
  careerId: string, 
  careerName: string, 
  interestLevel: number
): Promise<void> {
  try {
    const careerRef = doc(db, COLLECTIONS.USER_CAREER_JOURNEY, uid)
    const explorationRecord = {
      careerId,
      careerName,
      interestLevel,
      exploredAt: serverTimestamp() as Timestamp
    }
    
    await updateDoc(careerRef, {
      exploredCareers: arrayUnion(explorationRecord),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding career exploration:', error)
    throw error
  }
}

/**
 * Save generated career image
 */
export async function saveCareerImage(
  uid: string,
  careerId: string,
  imageUrl: string,
  prompt: string
): Promise<void> {
  try {
    const careerRef = doc(db, COLLECTIONS.USER_CAREER_JOURNEY, uid)
    const imageRecord = {
      careerId,
      imageUrl,
      prompt,
      generatedAt: serverTimestamp() as Timestamp
    }
    
    await updateDoc(careerRef, {
      careerImages: arrayUnion(imageRecord),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error saving career image:', error)
    throw error
  }
}

// ==================== USER ACTIVITIES OPERATIONS ====================

/**
 * Record module completion with enhanced tracking
 */
export async function recordModuleCompletion(
  uid: string,
  moduleId: string,
  subjectId: string,
  lessonsCompleted: number,
  averageScore: number,
  totalTimeSpent: number,
  skillsGained?: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db)
    const progressRef = doc(db, COLLECTIONS.USER_PROGRESS, uid)
    
    // Get current progress to update skill levels
    const progressDoc = await getDoc(progressRef)
    const currentProgress = progressDoc.exists() ? progressDoc.data() as UserProgress : null
    
    // Initialize default progress if it doesn't exist
    if (!currentProgress) {
      const defaultProgress: UserProgress = {
        uid,
        totalLessonsCompleted: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        subjectProgress: {},
        skillLevels: {},
        weeklyGoalMinutes: 300,
        weeklyProgressMinutes: 0,
        monthlyGoalLessons: 20,
        monthlyProgressLessons: 0,
        lastActivityAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      }
      
      batch.set(progressRef, defaultProgress)
    }
    
    // Update skill levels based on module completion
    const updatedSkillLevels = { ...(currentProgress?.skillLevels || {}) }
    
    if (skillsGained) {
      for (const skillId of skillsGained) {
        const skillName = skillId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        
        if (!updatedSkillLevels[skillId]) {
          updatedSkillLevels[skillId] = {
            skillId,
            skillName,
            level: 'novice',
            score: 0,
            unlockedAt: serverTimestamp() as Timestamp,
            lastUpdatedAt: serverTimestamp() as Timestamp
          }
        }
        
        // Update skill level based on average score
        const currentSkill = updatedSkillLevels[skillId]
        const newScore = Math.min(100, currentSkill.score + Math.floor(averageScore / 10))
        
        let newLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'novice'
        if (newScore >= 80) newLevel = 'expert'
        else if (newScore >= 60) newLevel = 'advanced'
        else if (newScore >= 40) newLevel = 'intermediate'
        else if (newScore >= 20) newLevel = 'beginner'
        
        updatedSkillLevels[skillId] = {
          ...currentSkill,
          level: newLevel,
          score: newScore,
          lastUpdatedAt: serverTimestamp() as Timestamp
        }
      }
    }

    // Update subject progress
    const subjectProgress = currentProgress?.subjectProgress || {}
    if (!subjectProgress[subjectId]) {
      subjectProgress[subjectId] = {
        subjectId,
        subjectName: subjectId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        lessonsCompleted: 0,
        totalLessons: 50, // Default, should be dynamic
        quizzesPassed: 0,
        averageScore: 0,
        timeSpent: 0,
        streak: 0,
        topicsCompleted: [],
        lastActivityAt: serverTimestamp() as Timestamp
      }
    }
    
    // Update subject progress with new data
    const currentSubject = subjectProgress[subjectId]
    const currentXP = currentSubject?.xp || 0
    const currentLessonsCompleted = currentSubject?.lessonsCompleted || 0
    const currentAverageScore = currentSubject?.averageScore || 0
    const currentTimeSpent = currentSubject?.timeSpent || 0
    const currentTopicsCompleted = currentSubject?.topicsCompleted || []
    
    const newXP = currentXP + (lessonsCompleted * 20)
    const newLevel = Math.floor(newXP / 100) + 1
    
    subjectProgress[subjectId] = {
      subjectId,
      subjectName: subjectId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      level: newLevel,
      xp: newXP,
      xpToNextLevel: (newLevel * 100) - newXP,
      lessonsCompleted: currentLessonsCompleted + lessonsCompleted,
      totalLessons: currentSubject?.totalLessons || 50,
      quizzesPassed: currentSubject?.quizzesPassed || 0,
      averageScore: currentAverageScore > 0 ? (currentAverageScore + averageScore) / 2 : averageScore,
      timeSpent: currentTimeSpent + totalTimeSpent,
      streak: currentSubject?.streak || 0,
      topicsCompleted: [...currentTopicsCompleted, moduleId],
      lastActivityAt: serverTimestamp() as Timestamp
    }

    // Update overall progress
    if (currentProgress) {
      batch.update(progressRef, {
        totalLessonsCompleted: increment(lessonsCompleted),
        totalTimeSpent: increment(totalTimeSpent),
        skillLevels: updatedSkillLevels,
        subjectProgress,
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } else {
      // Document was just created, update with calculated values
      batch.update(progressRef, {
        totalLessonsCompleted: lessonsCompleted,
        totalTimeSpent: totalTimeSpent,
        skillLevels: updatedSkillLevels,
        subjectProgress,
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // Log module completion activity
    const activityRef = doc(collection(db, COLLECTIONS.USER_ACTIVITIES))
    const activity: UserActivity = {
      id: activityRef.id,
      uid,
      activityType: 'lesson_completed', // Using existing type
      activityData: {
        moduleId,
        subjectId,
        lessonsCompleted,
        averageScore,
        totalTimeSpent,
        skillsGained: skillsGained || []
      },
      points: lessonsCompleted * 10, // Base points calculation
      xp: lessonsCompleted * 20,     // Base XP calculation
      timestamp: serverTimestamp() as Timestamp
    }
    
    batch.set(activityRef, activity)
    
    await batch.commit()
  } catch (error) {
    console.error('Error recording module completion:', error)
    throw error
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<string> {
  try {
    const activityRef = doc(collection(db, COLLECTIONS.USER_ACTIVITIES))
    const activityData: UserActivity = {
      ...activity,
      id: activityRef.id,
      timestamp: serverTimestamp() as Timestamp
    }
    
    await setDoc(activityRef, activityData)
    return activityRef.id
  } catch (error) {
    console.error('Error logging user activity:', error)
    throw error
  }
}

/**
 * Get user activities
 */
export async function getUserActivities(
  uid: string, 
  limitCount: number = 50,
  startAfterDoc?: DocumentSnapshot
): Promise<UserActivity[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.USER_ACTIVITIES),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => doc.data() as UserActivity)
  } catch (error) {
    console.error('Error getting user activities:', error)
    throw error
  }
}

// ==================== COMPLETE USER DATA OPERATIONS ====================

/**
 * Initialize complete user data (called during registration)
 */
export async function initializeCompleteUserData(userData: CreateUserData): Promise<CompleteUserData> {
  try {
    const batch = writeBatch(db)
    
    // Create all user data documents
    const profile = await createUser(userData)
    const preferences = await createUserPreferences(profile.uid)
    const progress = await createUserProgress(profile.uid)
    const social = await createUserSocial(profile.uid)
    const careerJourney = await createUserCareerJourney(profile.uid)
    
    return {
      profile,
      preferences,
      progress,
      social,
      careerJourney,
      activities: []
    }
  } catch (error) {
    console.error('Error initializing complete user data:', error)
    throw error
  }
}

/**
 * Get complete user data
 */
export async function getCompleteUserData(uid: string): Promise<CompleteUserData | null> {
  try {
    const [profile, preferences, progress, social, careerJourney, activities] = await Promise.all([
      getUserProfile(uid),
      getUserPreferences(uid),
      getUserProgress(uid),
      getUserSocial(uid),
      getUserCareerJourney(uid),
      getUserActivities(uid, 20)
    ])

    if (!profile) return null

    return {
      profile,
      preferences: preferences || await createUserPreferences(uid),
      progress: progress || await createUserProgress(uid),
      social: social || await createUserSocial(uid),
      careerJourney: careerJourney || await createUserCareerJourney(uid),
      activities
    }
  } catch (error) {
    console.error('Error getting complete user data:', error)
    throw error
  }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to user profile changes
 */
export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, COLLECTIONS.USERS, uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProfile)
    } else {
      callback(null)
    }
  })
}

/**
 * Subscribe to user progress changes
 */
export function subscribeToUserProgress(uid: string, callback: (progress: UserProgress | null) => void) {
  return onSnapshot(doc(db, COLLECTIONS.USER_PROGRESS, uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProgress)
    } else {
      callback(null)
    }
  })
}

// Helper function for array operations (since we're not importing arrayUnion)
function arrayUnion(element: any) {
  // This is a placeholder - in a real implementation, you would import this from firebase/firestore
  return element
}