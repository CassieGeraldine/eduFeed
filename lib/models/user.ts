import { Timestamp } from 'firebase/firestore'

// ==================== USER DATA MODELS ====================

/**
 * User Profile Information
 */
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  
  // Personal Information
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  
  // Location (South Africa specific)
  province?: string
  city?: string
  school?: string
  grade?: string
  
  // Account Status
  isActive: boolean
  isVerified: boolean
  accountType: 'student' | 'teacher' | 'parent' | 'admin'
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt?: Timestamp
}

/**
 * User Preferences and Settings
 */
export interface UserPreferences {
  uid: string
  
  // Learning Preferences
  preferredLanguage: 'en' | 'af' | 'zu' | 'xh' | 'st' | 'tn' | 'ss' | 've' | 'ts' | 'nr' | 'nd'
  preferredSubjects: string[]
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  studyGoals: string[]
  
  // Career Interests
  careerInterests: string[]
  dreamJob?: string
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  studyReminders: boolean
  achievementAlerts: boolean
  
  // Privacy Settings
  profileVisibility: 'public' | 'friends' | 'private'
  showProgress: boolean
  allowMentoring: boolean
  
  // App Settings
  theme: 'light' | 'dark' | 'system'
  autoPlayVideos: boolean
  dataUsage: 'low' | 'normal' | 'high'
  
  updatedAt: Timestamp
}

/**
 * User Learning Progress
 */
export interface UserProgress {
  uid: string
  
  // Overall Statistics
  totalLessonsCompleted: number
  totalTimeSpent: number // in minutes
  currentStreak: number
  longestStreak: number
  
  // Subject Progress
  subjectProgress: Record<string, SubjectProgress>
  
  // Skill Levels
  skillLevels: Record<string, SkillLevel>
  
  // Current Learning Path
  currentPathId?: string
  currentLessonId?: string
  
  // Goals and Targets
  weeklyGoalMinutes: number
  weeklyProgressMinutes: number
  monthlyGoalLessons: number
  monthlyProgressLessons: number
  
  // Timestamps
  lastActivityAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Subject-specific progress
 */
export interface SubjectProgress {
  subjectId: string
  subjectName: string
  
  level: number
  xp: number
  xpToNextLevel: number
  
  lessonsCompleted: number
  totalLessons: number
  
  quizzesPassed: number
  averageScore: number
  
  timeSpent: number // in minutes
  streak: number
  
  topicsCompleted: string[]
  currentTopic?: string
  
  lastActivityAt: Timestamp
}

/**
 * Skill levels and competencies
 */
export interface SkillLevel {
  skillId: string
  skillName: string
  
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  score: number // 0-100
  
  unlockedAt: Timestamp
  lastUpdatedAt: Timestamp
}

/**
 * User Activity Log
 */
export interface UserActivity {
  id: string
  uid: string
  
  activityType: 'lesson_completed' | 'quiz_taken' | 'achievement_earned' | 'career_explored' | 'goal_set' | 'streak_milestone'
  activityData: Record<string, any>
  
  points: number
  xp: number
  
  timestamp: Timestamp
}

/**
 * User Social Features
 */
export interface UserSocial {
  uid: string
  
  // Friends and Connections
  friends: string[] // Array of friend UIDs
  friendRequests: {
    sent: string[]
    received: string[]
  }
  
  // Study Groups
  studyGroups: string[] // Array of group IDs
  
  // Mentorship
  mentors: string[] // Array of mentor UIDs
  mentees: string[] // Array of mentee UIDs
  
  // Social Stats
  helpfulVotes: number
  questionsAsked: number
  answersGiven: number
  
  updatedAt: Timestamp
}

/**
 * User Career Journey
 */
export interface UserCareerJourney {
  uid: string
  
  // Career Assessment Results
  personalityType?: string
  strengthsAssessment: string[]
  interestAreas: string[]
  
  // Career Exploration
  exploredCareers: {
    careerId: string
    careerName: string
    interestLevel: number // 1-5
    exploredAt: Timestamp
  }[]
  
  // Dream Career
  dreamCareer?: {
    title: string
    description: string
    requirements: string[]
    setAt: Timestamp
  }
  
  // Career Goals
  shortTermGoals: string[]
  longTermGoals: string[]
  
  // Generated Images
  careerImages: {
    careerId: string
    imageUrl: string
    prompt: string
    generatedAt: Timestamp
  }[]
  
  updatedAt: Timestamp
}

// ==================== HELPER TYPES ====================

/**
 * User creation data (for registration)
 */
export interface CreateUserData {
  email: string
  displayName: string
  firstName: string
  lastName: string
  accountType: 'student' | 'teacher' | 'parent'
  
  // Optional fields
  photoURL?: string
  dateOfBirth?: string
  province?: string
  city?: string
  school?: string
  grade?: string
}

/**
 * User update data (for profile updates)
 */
export interface UpdateUserData extends Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>> {
  updatedAt?: Timestamp
}

/**
 * Complete user data (combination of all user-related data)
 */
export interface CompleteUserData {
  profile: UserProfile
  preferences: UserPreferences
  progress: UserProgress
  social: UserSocial
  careerJourney: UserCareerJourney
  activities: UserActivity[]
}

// ==================== VALIDATION HELPERS ====================

/**
 * South African provinces
 */
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State', 
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
] as const

/**
 * South African languages
 */
export const SA_LANGUAGES = {
  'en': 'English',
  'af': 'Afrikaans',
  'zu': 'isiZulu',
  'xh': 'isiXhosa',
  'st': 'Sesotho',
  'tn': 'Setswana',
  'ss': 'siSwati',
  've': 'Tshivenda',
  'ts': 'Xitsonga',
  'nr': 'isiNdebele',
  'nd': 'isiNdebele'
} as const

/**
 * School grades in South Africa
 */
export const SA_GRADES = [
  'Grade R',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
  'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
] as const

export type SAProvince = typeof SA_PROVINCES[number]
export type SALanguage = keyof typeof SA_LANGUAGES
export type SAGrade = typeof SA_GRADES[number]