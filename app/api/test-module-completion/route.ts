import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Simulate module completion for testing
    const testData = {
      uid: 'test-user-123',
      moduleId: 'math_module_1',
      subjectId: 'mathematics',
      lessonsCompleted: 5,
      averageScore: 85,
      totalTimeSpent: 120, // 2 hours
      skillsGained: ['algebra_basics', 'problem_solving']
    }

    // Call the actual module completion endpoint
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/module-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test module completion triggered',
      testData,
      result
    })

  } catch (error) {
    console.error('Error in test module completion:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Module completion test endpoint',
    description: 'Triggers a test module completion to verify the system works',
    testData: {
      uid: 'test-user-123',
      moduleId: 'math_module_1',
      subjectId: 'mathematics',
      lessonsCompleted: 5,
      averageScore: 85,
      totalTimeSpent: 120,
      skillsGained: ['algebra_basics', 'problem_solving']
    }
  })
}