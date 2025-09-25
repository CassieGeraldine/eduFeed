import { useState, useEffect } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserRewards } from '@/lib/models/rewards'
import { UserProgress, SubjectProgress, SkillLevel } from '@/lib/models/user'

interface UseUserRewardsResult {
  rewards: UserRewards | null
  progress: UserProgress | null
  loading: boolean
  error: string | null
  refreshData: () => void
}

/**
 * Hook to subscribe to user rewards and progress in real-time
 */
export function useUserRewards(uid: string | null): UseUserRewardsResult {
  const [rewards, setRewards] = useState<UserRewards | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshData = () => {
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    if (!uid) {
      setRewards(null)
      setProgress(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Subscribe to user rewards
    const unsubscribeRewards = onSnapshot(
      doc(db, 'userRewards', uid),
      (doc) => {
        if (doc.exists()) {
          setRewards({ uid: doc.id, ...doc.data() } as UserRewards)
        } else {
          setRewards(null)
        }
      },
      (err) => {
        console.error('Error fetching user rewards:', err)
        setError('Failed to fetch rewards data')
      }
    )

    // Subscribe to user progress
    const unsubscribeProgress = onSnapshot(
      doc(db, 'userProgress', uid),
      (doc) => {
        if (doc.exists()) {
          setProgress({ uid: doc.id, ...doc.data() } as UserProgress)
        } else {
          setProgress(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching user progress:', err)
        setError('Failed to fetch progress data')
        setLoading(false)
      }
    )

    // Cleanup subscriptions
    return () => {
      unsubscribeRewards()
      unsubscribeProgress()
    }
  }, [uid])

  return {
    rewards,
    progress,
    loading,
    error,
    refreshData
  }
}

/**
 * Hook for skill coins (points) with formatting
 */
export function useSkillCoins(uid: string | null) {
  const { rewards, loading, error } = useUserRewards(uid)
  
  return {
    skillCoins: rewards?.availablePoints || 0,
    totalEarned: rewards?.lifetimePointsEarned || 0,
    formattedCoins: (rewards?.availablePoints || 0).toLocaleString(),
    loading,
    error
  }
}

/**
 * Hook for user level and XP
 */
export function useUserLevel(uid: string | null) {
  const { rewards, loading, error } = useUserRewards(uid)
  
  const calculateXPToNextLevel = (currentLevel: number, currentXP: number) => {
    const LEVEL_THRESHOLDS = [
      0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7250, 9250,
      11500, 14000, 16750, 19750, 23000, 26500, 30250, 34250, 38500, 43000
    ]
    
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return 0 // Max level reached
    }
    
    return LEVEL_THRESHOLDS[currentLevel] - currentXP
  }

  const levelProgress = rewards ? 
    ((rewards.currentXP / (rewards.currentXP + rewards.xpToNextLevel)) * 100) : 0

  return {
    level: rewards?.currentLevel || 1,
    currentXP: rewards?.currentXP || 0,
    totalXP: rewards?.totalXPEarned || 0,
    xpToNextLevel: rewards?.xpToNextLevel || 100,
    levelProgress: Math.min(levelProgress, 100),
    loading,
    error
  }
}

/**
 * Hook for subject progress
 */
export function useSubjectProgress(uid: string | null) {
  const { progress, loading, error } = useUserRewards(uid)
  
  const subjects = progress?.subjectProgress ? Object.values(progress.subjectProgress) as SubjectProgress[] : []
  
  return {
    subjects,
    totalSubjects: subjects.length,
    averageProgress: subjects.length > 0 
      ? subjects.reduce((acc: number, subject: SubjectProgress) => acc + (subject.lessonsCompleted / subject.totalLessons * 100), 0) / subjects.length
      : 0,
    loading,
    error
  }
}

/**
 * Hook for skill levels
 */
export function useSkillLevels(uid: string | null) {
  const { progress, loading, error } = useUserRewards(uid)
  
  const skills = progress?.skillLevels ? Object.values(progress.skillLevels) as SkillLevel[] : []
  
  const skillCounts = skills.reduce((acc: Record<string, number>, skill: SkillLevel) => {
    acc[skill.level] = (acc[skill.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    skills,
    totalSkills: skills.length,
    skillCounts,
    expertSkills: skills.filter((skill: SkillLevel) => skill.level === 'expert').length,
    advancedSkills: skills.filter((skill: SkillLevel) => skill.level === 'advanced').length,
    loading,
    error
  }
}