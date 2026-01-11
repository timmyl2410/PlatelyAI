import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, Check, Loader2, AlertCircle, Camera } from 'lucide-react';
import { uploadImage } from '../../lib/firebase';

export function MobileUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // =========================================================================
  // VALIDATION
  // =========================================================================
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">No session ID found. Please scan a valid QR code.</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FUNCTION: Upload image to Firebase
  // =========================================================================
  const uploadImageToFirebase = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      console.log('📤 Uploading to Firebase...');
      console.log('📦 SessionId:', sessionId);
      console.log('🖼️  File size:', file.size, 'bytes');

      const downloadURL = await uploadImage(file, sessionId);

      console.log('✅ Upload successful:', downloadURL);
      
      setUploadSuccess(true);
      setUploading(false);

      // Auto-close after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('❌ Upload error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to upload: ${errorMsg}`);
      setUploading(false);
    }
  };

  // =========================================================================
  // FUNCTION: Handle file selection from device
  // =========================================================================
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadImageToFirebase(file);
    } catch (err) {
      setError('Failed to read file. Please try again.');
    }
  };

  // =========================================================================
  // FUNCTION: Take a photo with camera
  // =========================================================================
  const startCamera = async () => {
    try {
      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      console.log('✅ Camera accessed');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Camera access failed: ${errorMsg}`);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Draw video frame to canvas
    context.drawImage(videoRef.current, 0, 0);

    // Convert canvas to blob
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture photo');
        return;
      }

      // Convert blob to file
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Stop camera stream
      const stream = videoRef.current!.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);

      // Upload the file
      await uploadImageToFirebase(file);
    }, 'image/jpeg', 0.8);
  };

  // =========================================================================
  // UI: Success state
  // =========================================================================
  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <div className="w-16 h-16 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h1>
          <p className="text-gray-600">Your photo has been received. Redirecting...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // UI: Camera active
  // =========================================================================
  if (cameraActive) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full max-w-sm rounded-lg"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-6 flex gap-4 w-full max-w-sm">
          <button
            onClick={capturePhoto}
            className="flex-1 bg-[#2ECC71] text-white py-3 rounded-lg font-bold hover:bg-[#1E8449] transition"
          >
            Capture Photo
          </button>
          <button
            onClick={() => {
              if (videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
              }
              setCameraActive(false);
            }}
            className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // UI: Main upload options
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F9FAF7] py-8 px-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Photo</h1>
          <p className="text-gray-600 text-sm">Session ID: {sessionId.slice(0, 8)}...</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {uploading && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <Loader2 className="mx-auto text-[#2ECC71] animate-spin mb-4" size={48} />
            <p className="text-gray-600">Uploading your photo...</p>
          </div>
        )}

        {/* Upload options */}
        {!uploading && (
          <div className="space-y-4">
            {/* Camera button */}
            <button
              onClick={startCamera}
              className="w-full bg-[#2ECC71] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#1E8449] transition-all shadow-md flex items-center justify-center gap-3"
            >
              <Camera size={24} />
              Take a Photo
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F9FAF7] text-gray-500">or</span>
              </div>
            </div>

            {/* Upload from device */}
            <label className="w-full bg-white text-gray-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer border-2 border-gray-300">
              <Upload size={24} />
              Choose from Device
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
