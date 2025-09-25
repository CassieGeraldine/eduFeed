import { NextRequest, NextResponse } from 'next/server'
import { testFirebaseConnection, initializeDatabase } from '@/lib/database/initialize'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    // Test Firebase connection
    const isConnected = await testFirebaseConnection()
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Firebase',
        error: 'Connection test failed'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Firebase test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Firebase test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    
    if (action === 'initialize') {
      await initializeDatabase()
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully with default data' 
      })
    }
    
    if (action === 'get_badges') {
      const badgesRef = collection(db, 'badges')
      const snapshot = await getDocs(badgesRef)
      const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      return NextResponse.json({ 
        success: true, 
        data: badges,
        count: badges.length
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid action. Use "initialize" or "get_badges" to test data.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Firebase test error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}