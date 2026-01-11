// Netlify Function: POST /api/upload -> /.netlify/functions/upload
// Uploads an image to Cloudinary and stores reference in Firestore

import { v2 as cloudinary } from 'cloudinary';
import { getFirestore, admin } from './_lib/firebaseAdmin.js';
import { corsHeaders, handleOptions, successResponse, errorResponse } from './_lib/helpers.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function handler(event, context) {
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  console.log('📨 Upload request received');

  try {
    const body = JSON.parse(event.body || '{}');
    const { sessionId, base64Image } = body;

    console.log('📦 SessionId:', sessionId);
    console.log('🖼️  Image size:', base64Image?.length || 0, 'bytes');

    // Validate inputs
    if (!sessionId || !base64Image) {
      return errorResponse('Missing sessionId or image data', 400);
    }

    const firestore = getFirestore();
    const sessionRef = firestore.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    // Check if session exists
    if (!sessionDoc.exists) {
      return errorResponse('Session not found', 404);
    }

    // Upload to Cloudinary
    console.log(`📤 Uploading image for session ${sessionId}...`);
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `platify/${sessionId}`,
      resource_type: 'auto',
    });

    // Store image URL in Firestore session
    const imageData = {
      url: result.secure_url,
      uploadedAt: admin.firestore.Timestamp.now(),
      cloudinaryPublicId: result.public_id,
    };

    await sessionRef.update({
      images: admin.firestore.FieldValue.arrayUnion(imageData),
    });

    const updatedSession = await sessionRef.get();
    const images = updatedSession.data().images || [];

    console.log(`✅ Image uploaded: ${result.secure_url}`);
    return successResponse({
      success: true,
      url: result.secure_url,
      images,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('Upload failed', 500, error.message);
  }
}
