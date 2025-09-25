import { Timestamp } from 'firebase/firestore'

// ==================== REWARDS DATA MODELS ====================

/**
 * User Rewards Summary
 */
export interface UserRewards {
  uid: string
  
  // Points System
  totalPoints: number
  availablePoints: number // points that can be spent
  lifetimePointsEarned: number
  
  // Levels and XP
  currentLevel: number
  currentXP: number
  xpToNextLevel: number
  totalXPEarned: number
  
  // Badges and Achievements
  totalBadges: number
  totalAchievements: number
  
  // Streaks
  currentStreak: number
  longestStreak: number
  
  // Redemption History
  totalRedemptions: number
  totalSpent: number
  
  // Timestamps
  lastEarnedAt?: Timestamp
  lastRedeemedAt?: Timestamp
  updatedAt: Timestamp
}

/**
 * Points Transaction History
 */
export interface PointsTransaction {
  id: string
  uid: string
  
  type: 'earned' | 'spent' | 'bonus' | 'penalty'
  amount: number
  balance: number // points balance after this transaction
  
  // Source/Reason for transaction
  source: 'lesson_completion' | 'quiz_passed' | 'achievement' | 'streak_bonus' | 
          'daily_login' | 'referral' | 'purchase' | 'redemption' | 'admin_adjustment' |
          'module_completion' | 'level_up' | 'skill_mastery'
  
  sourceId?: string // ID of the lesson, quiz, achievement, etc.
  description: string
  
  // Metadata
  metadata?: Record<string, any>
  
  timestamp: Timestamp
}

/**
 * Badge System
 */
export interface Badge {
  id: string
  
  // Badge Information
  name: string
  description: string
  category: 'learning' | 'social' | 'achievement' | 'special' | 'career'
  
  // Visual
  iconUrl: string
  color: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  
  // Requirements
  requirements: BadgeRequirement[]
  isSecret: boolean // Hidden until earned
  
  // Points and Rewards
  pointsReward: number
  xpReward: number
  
  // Status
  isActive: boolean
  isLimited: boolean // Limited time badge
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt?: Timestamp
}

/**
 * Badge Requirements
 */
export interface BadgeRequirement {
  type: 'lesson_count' | 'quiz_score' | 'streak_days' | 'subject_mastery' | 
        'time_spent' | 'consecutive_days' | 'perfect_quizzes' | 'career_exploration'
  
  value: number
  condition?: 'greater_than' | 'equal_to' | 'less_than'
  metadata?: Record<string, any>
}

/**
 * User's Badge Collection
 */
export interface UserBadge {
  id: string
  uid: string
  badgeId: string
  
  // Badge Details (denormalized for performance)
  badgeName: string
  badgeIconUrl: string
  badgeRarity: string
  
  // Earning Details
  earnedAt: Timestamp
  progress: number // 0-100, progress towards earning the badge
  isCompleted: boolean
  
  // Context
  earnedFor?: string // What specific activity earned this badge
  metadata?: Record<string, any>
}

/**
 * Achievements System
 */
export interface Achievement {
  id: string
  
  // Achievement Information
  title: string
  description: string
  category: 'academic' | 'social' | 'personal' | 'career' | 'special'
  
  // Difficulty and Rewards
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  pointsReward: number
  xpReward: number
  badgeReward?: string // Badge ID to award
  
  // Requirements
  requirements: AchievementRequirement[]
  prerequisites?: string[] // Achievement IDs that must be completed first
  
  // Visual
  iconUrl: string
  bannerUrl?: string
  
  // Status
  isActive: boolean
  isHidden: boolean // Hidden until prerequisites are met
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Achievement Requirements
 */
export interface AchievementRequirement {
  type: 'complete_lessons' | 'pass_quizzes' | 'maintain_streak' | 'earn_points' |
        'unlock_badges' | 'explore_careers' | 'help_others' | 'perfect_scores'
  
  target: number
  current?: number
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'lifetime'
  metadata?: Record<string, any>
}

/**
 * User's Achievement Progress
 */
export interface UserAchievement {
  id: string
  uid: string
  achievementId: string
  
  // Achievement Details (denormalized)
  achievementTitle: string
  achievementIconUrl: string
  achievementDifficulty: string
  
  // Progress
  progress: AchievementProgress[]
  overallProgress: number // 0-100
  isCompleted: boolean
  
  // Completion Details
  completedAt?: Timestamp
  earnedPoints?: number
  earnedXP?: number
  earnedBadgeId?: string
  
  // Tracking
  startedAt: Timestamp
  lastUpdatedAt: Timestamp
}

/**
 * Progress towards individual achievement requirements
 */
export interface AchievementProgress {
  requirementType: string
  target: number
  current: number
  isCompleted: boolean
  completedAt?: Timestamp
}

/**
 * Rewards Store Items
 */
export interface StoreItem {
  id: string
  
  // Item Information
  name: string
  description: string
  category: 'digital' | 'physical' | 'experience' | 'educational' | 'mobile_data'
  
  // Pricing
  pointsCost: number
  cashValue?: number // Real-world value in ZAR
  
  // Availability
  isAvailable: boolean
  stockQuantity?: number // null = unlimited
  isLimited: boolean
  
  // Requirements
  minimumLevel?: number
  requiredBadges?: string[]
  
  // Visual
  imageUrl: string
  thumbnailUrl: string
  
  // Item Details
  itemType: 'airtime' | 'data_bundle' | 'voucher' | 'course_access' | 'merchandise' | 'other'
  itemData: Record<string, any> // Specific data for the item type
  
  // Provider Information (for South African services)
  provider?: 'vodacom' | 'mtn' | 'cell_c' | 'telkom' | 'rain' | 'other'
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt?: Timestamp
}

/**
 * User's Redemption History
 */
export interface RedemptionRecord {
  id: string
  uid: string
  
  // Item Details
  storeItemId: string
  itemName: string
  itemCategory: string
  
  // Transaction Details
  pointsSpent: number
  cashValue?: number
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  
  // Delivery Information
  deliveryMethod: 'digital' | 'email' | 'sms' | 'physical' | 'in_app'
  deliveryDetails?: {
    phoneNumber?: string
    email?: string
    address?: string
    trackingNumber?: string
  }
  
  // Fulfillment
  fulfillmentCode?: string // For digital items like airtime
  isDelivered: boolean
  deliveredAt?: Timestamp
  
  // Error Handling
  errorMessage?: string
  retryCount: number
  
  // Timestamps
  redeemedAt: Timestamp
  updatedAt: Timestamp
  expiresAt?: Timestamp
}

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  id: string
  uid: string
  
  // User Info (denormalized for performance)
  displayName: string
  photoURL?: string
  school?: string
  grade?: string
  
  // Ranking
  rank: number
  previousRank?: number
  
  // Scores
  totalPoints: number
  totalXP: number
  weeklyPoints: number
  monthlyPoints: number
  
  // Activity
  streakDays: number
  lessonsCompleted: number
  badgesEarned: number
  
  // Period
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  periodStart: Timestamp
  periodEnd: Timestamp
  
  // Timestamps
  updatedAt: Timestamp
}

/**
 * Special Events and Challenges
 */
export interface SpecialEvent {
  id: string
  
  // Event Information
  title: string
  description: string
  type: 'challenge' | 'competition' | 'bonus_week' | 'community_goal'
  
  // Timing
  startDate: Timestamp
  endDate: Timestamp
  isActive: boolean
  
  // Rewards
  rewards: {
    first?: { points: number, badge?: string, item?: string }
    second?: { points: number, badge?: string, item?: string }
    third?: { points: number, badge?: string, item?: string }
    participation?: { points: number, badge?: string }
  }
  
  // Requirements
  requirements: {
    type: string
    target: number
    timeframe: string
  }[]
  
  // Participants
  participantCount: number
  maxParticipants?: number
  
  // Visual
  bannerUrl: string
  iconUrl: string
  
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * User participation in special events
 */
export interface UserEventParticipation {
  id: string
  uid: string
  eventId: string
  
  // Event Details (denormalized)
  eventTitle: string
  eventType: string
  
  // Progress
  progress: Record<string, number>
  rank?: number
  isCompleted: boolean
  
  // Rewards
  rewardsEarned: {
    points: number
    badges: string[]
    items: string[]
  }
  
  // Timestamps
  joinedAt: Timestamp
  completedAt?: Timestamp
  lastUpdatedAt: Timestamp
}

// ==================== REWARDS CONFIGURATION ====================

/**
 * Points earning rates configuration
 */
export const POINTS_CONFIG = {
  LESSON_COMPLETION: 10,
  QUIZ_PASS: 15,
  QUIZ_PERFECT: 25,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 2, // per day of streak
  ACHIEVEMENT_BONUS: 50,
  BADGE_BONUS: 25,
  CAREER_EXPLORATION: 8,
  HELP_OTHERS: 5,
  FIRST_TIME_BONUS: 100
} as const

/**
 * XP earning rates configuration
 */
export const XP_CONFIG = {
  LESSON_COMPLETION: 20,
  QUIZ_PASS: 30,
  QUIZ_PERFECT: 50,
  BADGE_EARNED: 100,
  ACHIEVEMENT_UNLOCKED: 200,
  LEVEL_UP_BONUS: 500
} as const

/**
 * Level progression thresholds
 */
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7250, 9250,
  11500, 14000, 16750, 19750, 23000, 26500, 30250, 34250, 38500, 43000
] as const

// ==================== HELPER TYPES ====================

/**
 * Reward earning context
 */
export interface RewardContext {
  sourceType: string
  sourceId: string
  description: string
  metadata?: Record<string, any>
}

/**
 * Bulk reward operation
 */
export interface BulkRewardOperation {
  uid: string
  points: number
  xp: number
  source: string
  description: string
  timestamp?: Timestamp
}

export type BadgeCategory = Badge['category']
export type AchievementCategory = Achievement['category']
export type StoreItemCategory = StoreItem['category']
export type RedemptionStatus = RedemptionRecord['status']