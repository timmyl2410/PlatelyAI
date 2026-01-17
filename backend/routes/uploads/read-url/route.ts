import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminStorage } from '@/src/lib/firebase-admin'

/**
 * GET /api/uploads/read-url?path=<storagePath>
 * Generate short-lived signed URL for reading images
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const idToken = authHeader.split('Bearer ')[1]
    let decodedToken
    
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Get storage path from query params
    const { searchParams } = new URL(req.url)
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      )
    }

    // 3. Verify path ownership - must be under /users/{uid}/
    const expectedPrefix = `users/${uid}/`
    if (!storagePath.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Access denied. You can only access files in your own directory.' },
        { status: 403 }
      )
    }

    // 4. Generate signed read URL (valid for 15 minutes)
    const bucket = adminStorage.bucket()
    const file = bucket.file(storagePath)
    
    // Verify file exists
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    })

    console.log(`Read URL generated: uid=${uid}, path=${storagePath}`)

    // 5. Return signed URL
    return NextResponse.json({
      url: signedUrl,
      expiresIn: 900, // seconds
    })

  } catch (error: any) {
    console.error('Read URL generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate read URL' },
      { status: 500 }
    )
  }
}
