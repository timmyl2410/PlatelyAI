import express from 'express';
import { getAuth, getBucket, getFirestore } from '../firebaseAdmin.js';

const router = express.Router();

/**
 * POST /api/uploads/init
 * Initialize upload and generate signed upload URL
 */
router.post('/uploads/init', async (req, res) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    const uid = decodedToken.uid;

    // 2. Parse and validate request body
    const { scanId, source, contentType } = req.body;

    if (!scanId || !source || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields: scanId, source, contentType'
      });
    }

    if (source !== 'fridge' && source !== 'pantry') {
      return res.status(400).json({
        error: 'Invalid source. Must be "fridge" or "pantry"'
      });
    }

    // Validate content type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid content type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // 3. Generate storage path
    const timestamp = Date.now();
    const extension = contentType.split('/')[1]; // jpeg, png, webp
    const filename = `${source}_${timestamp}.${extension}`;
    const storagePath = `users/${uid}/uploads/${scanId}/${filename}`;

    // 4. Generate signed upload URL (valid for 15 minutes)
    const bucket = getBucket();
    const file = bucket.file(storagePath);
    
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });

    console.log(`Upload initialized: uid=${uid}, scanId=${scanId}, source=${source}, path=${storagePath}`);

    // 5. Return upload target
    return res.json({
      uploadUrl,
      storagePath,
      contentType,
      expiresIn: 900, // seconds
    });

  } catch (error) {
    console.error('Upload init error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to initialize upload'
    });
  }
});

/**
 * POST /api/uploads/complete
 * Finalize upload and save metadata to Firestore
 */
router.post('/uploads/complete', async (req, res) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    const uid = decodedToken.uid;

    // 2. Parse and validate request body
    const { scanId, source, storagePath, clientMeta } = req.body;

    if (!scanId || !source || !storagePath) {
      return res.status(400).json({
        error: 'Missing required fields: scanId, source, storagePath'
      });
    }

    // 3. Verify path ownership - must be under /users/{uid}/
    const expectedPrefix = `users/${uid}/uploads/${scanId}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      return res.status(403).json({
        error: 'Invalid storage path. Path must be under your user directory.'
      });
    }

    // 4. Verify file exists in storage
    const bucket = getBucket();
    const file = bucket.file(storagePath);
    
    let fileExists = false;
    let fileMetadata = {};
    
    try {
      const [exists] = await file.exists();
      fileExists = exists;
      
      if (exists) {
        const [metadata] = await file.getMetadata();
        fileMetadata = metadata;
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
    }

    if (!fileExists) {
      return res.status(404).json({
        error: 'File not found in storage. Upload may have failed.'
      });
    }

    // 5. Save metadata to Firestore
    const db = getFirestore();
    const scanRef = db.collection('scans').doc(scanId);
    
    const imageData = {
      storagePath,
      contentType: fileMetadata.contentType || 'image/jpeg',
      sizeBytes: clientMeta?.sizeBytes || parseInt(fileMetadata.size) || 0,
      width: clientMeta?.width,
      height: clientMeta?.height,
      uploadedAt: new Date().toISOString(),
    };

    // Use a transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      const scanDoc = await transaction.get(scanRef);
      
      if (!scanDoc.exists) {
        // Create new scan document
        transaction.set(scanRef, {
          uid,
          createdAt: new Date().toISOString(),
          status: 'uploaded',
          images: {
            [source]: imageData,
          },
        });
      } else {
        // Verify ownership
        const existingData = scanDoc.data();
        if (existingData?.uid !== uid) {
          throw new Error('Unauthorized: You do not own this scan');
        }
        
        // Update existing scan document
        transaction.update(scanRef, {
          [`images.${source}`]: imageData,
          status: 'uploaded',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`Upload completed: uid=${uid}, scanId=${scanId}, source=${source}, size=${imageData.sizeBytes}`);

    // 6. Return success with metadata
    return res.json({
      success: true,
      scanId,
      source,
      metadata: imageData,
    });

  } catch (error) {
    console.error('Upload complete error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Failed to complete upload'
    });
  }
});

/**
 * GET /api/uploads/read-url?path=<storagePath>
 * Generate short-lived signed URL for reading images
 */
router.get('/uploads/read-url', async (req, res) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    const uid = decodedToken.uid;

    // 2. Get storage path from query params
    const storagePath = req.query.path;

    if (!storagePath) {
      return res.status(400).json({
        error: 'Missing required parameter: path'
      });
    }

    // 3. Verify path ownership - must be under /users/{uid}/
    const expectedPrefix = `users/${uid}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      return res.status(403).json({
        error: 'Access denied. You can only access files in your own directory.'
      });
    }

    // 4. Generate signed read URL (valid for 15 minutes)
    const bucket = getBucket();
    const file = bucket.file(storagePath);
    
    // Verify file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    console.log(`Read URL generated: uid=${uid}, path=${storagePath}`);

    // 5. Return signed URL
    return res.json({
      url: signedUrl,
      expiresIn: 900, // seconds
    });

  } catch (error) {
    console.error('Read URL generation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate read URL'
    });
  }
});

export default router;
