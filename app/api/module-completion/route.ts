import { NextRequest, NextResponse } from 'next/server'
import { recordModuleCompletion } from '@/lib/services/userService'
import { processModuleCompletionRewards } from '@/lib/services/rewardsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      uid, 
      moduleId, 
      subjectId, 
      lessonsCompleted, 
      averageScore, 
      totalTimeSpent, 
      skillsGained 
    } = body

    // Validate required fields
    if (!uid || !moduleId || !subjectId || lessonsCompleted === undefined || averageScore === undefined || totalTimeSpent === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: uid, moduleId, subjectId, lessonsCompleted, averageScore, totalTimeSpent' },
        { status: 400 }
      )
    }

    // Validate data types and ranges
    if (typeof lessonsCompleted !== 'number' || lessonsCompleted < 0) {
      return NextResponse.json(
        { success: false, error: 'lessonsCompleted must be a non-negative number' },
        { status: 400 }
      )
    }

    if (typeof averageScore !== 'number' || averageScore < 0 || averageScore > 100) {
      return NextResponse.json(
        { success: false, error: 'averageScore must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    if (typeof totalTimeSpent !== 'number' || totalTimeSpent < 0) {
      return NextResponse.json(
        { success: false, error: 'totalTimeSpent must be a non-negative number' },
        { status: 400 }
      )
    }

    // Record module completion in user progress
    await recordModuleCompletion(
      uid,
      moduleId,
      subjectId,
      lessonsCompleted,
      averageScore,
      totalTimeSpent,
      skillsGained
    )

    // Process rewards for module completion
    const rewardsResult = await processModuleCompletionRewards(
      uid,
      moduleId,
      subjectId,
      lessonsCompleted,
      averageScore,
      totalTimeSpent,
      skillsGained
    )

    return NextResponse.json({
      success: true,
      message: 'Module completion processed successfully',
      rewards: rewardsResult,
      skillCoins: rewardsResult.pointsAwarded,
      xp: rewardsResult.xpAwarded,
      badges: rewardsResult.badgesEarned,
      levelUp: rewardsResult.levelUp,
      newLevel: rewardsResult.newLevel
    })

  } catch (error) {
    console.error('Error processing module completion:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process module completion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Module completion API endpoint',
    methods: ['POST'],
    description: 'Submit module completion data to update user progress and rewards',
    requiredFields: {
      uid: 'string - User ID',
      moduleId: 'string - Module identifier',
      subjectId: 'string - Subject identifier',
      lessonsCompleted: 'number - Number of lessons completed in module',
      averageScore: 'number - Average score achieved (0-100)',
      totalTimeSpent: 'number - Total time spent in minutes'
    },
    optionalFields: {
      skillsGained: 'string[] - Array of skill IDs gained from module'
    }
  })
}