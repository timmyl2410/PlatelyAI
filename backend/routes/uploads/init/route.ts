import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminStorage } from '@/src/lib/firebase-admin'

interface InitUploadRequest {
  scanId: string
  source: 'fridge' | 'pantry'
  contentType: string
}

/**
 * POST /api/uploads/init
 * Initialize upload and generate signed upload URL
 */
export async function POST(req: NextRequest) {
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

    // 2. Parse and validate request body
    const body: InitUploadRequest = await req.json()
    const { scanId, source, contentType } = body

    if (!scanId || !source || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: scanId, source, contentType' },
        { status: 400 }
      )
    }

    if (source !== 'fridge' && source !== 'pantry') {
      return NextResponse.json(
        { error: 'Invalid source. Must be "fridge" or "pantry"' },
        { status: 400 }
      )
    }

    // Validate content type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 3. Generate storage path
    const timestamp = Date.now()
    const extension = contentType.split('/')[1] // jpeg, png, webp
    const filename = `${source}_${timestamp}.${extension}`
    const storagePath = `users/${uid}/uploads/${scanId}/${filename}`

    // 4. Generate signed upload URL (valid for 15 minutes)
    const bucket = adminStorage.bucket()
    const file = bucket.file(storagePath)
    
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    })

    console.log(`Upload initialized: uid=${uid}, scanId=${scanId}, source=${source}, path=${storagePath}`)

    // 5. Return upload target
    return NextResponse.json({
      uploadUrl,
      storagePath,
      contentType,
      expiresIn: 900, // seconds
    })

  } catch (error: any) {
    console.error('Upload init error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize upload' },
      { status: 500 }
    )
  }
}
