import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb, adminStorage } from '@/src/lib/firebase-admin'

interface CompleteUploadRequest {
  scanId: string
  source: 'fridge' | 'pantry'
  storagePath: string
  clientMeta?: {
    width?: number
    height?: number
    sizeBytes?: number
  }
}

/**
 * POST /api/uploads/complete
 * Finalize upload and save metadata to Firestore
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
    const body: CompleteUploadRequest = await req.json()
    const { scanId, source, storagePath, clientMeta } = body

    if (!scanId || !source || !storagePath) {
      return NextResponse.json(
        { error: 'Missing required fields: scanId, source, storagePath' },
        { status: 400 }
      )
    }

    // 3. Verify path ownership - must be under /users/{uid}/
    const expectedPrefix = `users/${uid}/uploads/${scanId}/`
    if (!storagePath.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Invalid storage path. Path must be under your user directory.' },
        { status: 403 }
      )
    }

    // 4. Verify file exists in storage
    const bucket = adminStorage.bucket()
    const file = bucket.file(storagePath)
    
    let fileExists = false
    let fileMetadata: any = {}
    
    try {
      const [exists] = await file.exists()
      fileExists = exists
      
      if (exists) {
        const [metadata] = await file.getMetadata()
        fileMetadata = metadata
      }
    } catch (error) {
      console.error('Error checking file existence:', error)
    }

    if (!fileExists) {
      return NextResponse.json(
        { error: 'File not found in storage. Upload may have failed.' },
        { status: 404 }
      )
    }

    // 5. Save metadata to Firestore
    const scanRef = adminDb.collection('scans').doc(scanId)
    
    const imageData = {
      storagePath,
      contentType: fileMetadata.contentType || 'image/jpeg',
      sizeBytes: clientMeta?.sizeBytes || parseInt(fileMetadata.size) || 0,
      width: clientMeta?.width,
      height: clientMeta?.height,
      uploadedAt: new Date().toISOString(),
    }

    // Use a transaction to ensure atomic update
    await adminDb.runTransaction(async (transaction) => {
      const scanDoc = await transaction.get(scanRef)
      
      if (!scanDoc.exists) {
        // Create new scan document
        transaction.set(scanRef, {
          uid,
          createdAt: new Date().toISOString(),
          status: 'uploaded',
          images: {
            [source]: imageData,
          },
        })
      } else {
        // Verify ownership
        const existingData = scanDoc.data()
        if (existingData?.uid !== uid) {
          throw new Error('Unauthorized: You do not own this scan')
        }
        
        // Update existing scan document
        transaction.update(scanRef, {
          [`images.${source}`]: imageData,
          status: 'uploaded',
          updatedAt: new Date().toISOString(),
        })
      }
    })

    console.log(`Upload completed: uid=${uid}, scanId=${scanId}, source=${source}, size=${imageData.sizeBytes}`)

    // 6. Return success with metadata
    return NextResponse.json({
      success: true,
      scanId,
      source,
      metadata: imageData,
    })

  } catch (error: any) {
    console.error('Upload complete error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to complete upload' },
      { status: 500 }
    )
  }
}
