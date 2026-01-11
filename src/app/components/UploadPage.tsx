import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Upload, Check, Loader2, Camera, X, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createSession, getSession, subscribeToSession, uploadImage } from '../../lib/firebase';

const frontendUrl = window.location.origin; // Will be https://myplately.com in production

type UploadStatus = 'idle' | 'waiting' | 'received' | 'complete';

type SessionData = {
  id: string;
  createdAt: any;
  images: Array<{ url: string; uploadedAt: any }>;
};

export function UploadPage() {
  const navigate = useNavigate();
  const [fridgeStatus, setFridgeStatus] = useState<UploadStatus>('idle');
  const [pantryStatus, setPantryStatus] = useState<UploadStatus>('idle');
  const [showQR, setShowQR] = useState<'fridge' | 'pantry' | null>(null);
  const [fridgeImages, setFridgeImages] = useState<File[]>([]);
  const [pantryImages, setPantryImages] = useState<File[]>([]);
  const [fridgeSessionId, setFridgeSessionId] = useState<string | null>(null);
  const [pantrySessionId, setPantrySessionId] = useState<string | null>(null);
  const [fridgeUploadedImages, setFridgeUploadedImages] = useState<Array<{ url: string; uploadedAt: any }>>([]);
  const [pantryUploadedImages, setPantryUploadedImages] = useState<Array<{ url: string; uploadedAt: any }>>([]);
  const [isPolling, setIsPolling] = useState(false);

  // =========================================================================
  // UX: Show QR for an existing session (don't create a new one)
  // =========================================================================
  const showQrForType = async (type: 'fridge' | 'pantry') => {
    const existingSessionId = type === 'fridge' ? fridgeSessionId : pantrySessionId;
    if (existingSessionId) {
      setShowQR(type);
      return;
    }

    await createSessionForType(type);
  };

  // =========================================================================
  // REAL-TIME: Listen for uploads (Firestore onSnapshot)
  // =========================================================================
  useEffect(() => {
    if (!fridgeSessionId) return;

    const unsubscribe = subscribeToSession(fridgeSessionId, (data) => {
      if (!data || typeof data !== 'object') return;
      const images = (data as any).images ?? [];
      setFridgeUploadedImages(images);
      if (Array.isArray(images) && images.length > 0) setFridgeStatus('complete');
    });

    return () => unsubscribe();
  }, [fridgeSessionId]);

  useEffect(() => {
    if (!pantrySessionId) return;

    const unsubscribe = subscribeToSession(pantrySessionId, (data) => {
      if (!data || typeof data !== 'object') return;
      const images = (data as any).images ?? [];
      setPantryUploadedImages(images);
      if (Array.isArray(images) && images.length > 0) setPantryStatus('complete');
    });

    return () => unsubscribe();
  }, [pantrySessionId]);

  // =========================================================================
  // FUNCTION: Create a new session and generate QR code
  // =========================================================================
  const createSessionForType = async (type: 'fridge' | 'pantry') => {
    try {
      // Check if Firebase is properly configured
      const firebaseConfig = await import('../../lib/firebaseConfig');
      if (firebaseConfig.default.apiKey === 'your-api-key-here') {
        alert('❌ Firebase not configured! Please set up Firebase first.\n\n1. Go to https://console.firebase.google.com/\n2. Create a project\n3. Enable Firestore and Storage\n4. Update src/lib/firebaseConfig.ts with your values\n5. Check FIREBASE_SETUP.md for detailed instructions');
        return;
      }

      console.log('🔄 Creating session...');
      const sessionId = await createSession();
      console.log('✅ Session created:', sessionId);

      if (type === 'fridge') {
        setFridgeSessionId(sessionId);
      } else {
        setPantrySessionId(sessionId);
      }

      setShowQR(type);
      // Real-time listener is attached via useEffect above
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      alert(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // =========================================================================
  // FUNCTION: Poll Firebase for new uploads
  // =========================================================================
  const startPolling = async (sessionId: string, type: 'fridge' | 'pantry') => {
    setIsPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const session = (await getSession(sessionId)) as SessionData | null;
        if (!session) return;

        if (type === 'fridge') {
          setFridgeUploadedImages(session.images || []);
          if (session.images && session.images.length > 0) {
            setFridgeStatus('complete');
          }
        } else {
          setPantryUploadedImages(session.images || []);
          if (session.images && session.images.length > 0) {
            setPantryStatus('complete');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval ID for cleanup (you'd need to store this in state)
    return pollInterval;
  };

  const handleFileUpload = async (type: 'fridge' | 'pantry', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const setImages = type === 'fridge' ? setFridgeImages : setPantryImages;
    const setStatus = type === 'fridge' ? setFridgeStatus : setPantryStatus;

    // Keep local preview
    setImages((prev) => [...prev, ...fileArray]);
    setStatus('received');

    try {
      // Ensure we have a session so we can store image URLs for scanning
      let sessionId = type === 'fridge' ? fridgeSessionId : pantrySessionId;
      if (!sessionId) {
        sessionId = await createSession();
        if (type === 'fridge') setFridgeSessionId(sessionId);
        else setPantrySessionId(sessionId);
      }

      // Upload all selected images to Firebase Storage + add URLs to Firestore session
      await Promise.all(fileArray.map((file) => uploadImage(file, sessionId!)));

      // The Firestore listener will also set status to complete when images exist,
      // but we set it here for immediate feedback.
      // Clear local previews so we don't show the same image twice (it's now in the session).
      setImages([]);
      setStatus('complete');
    } catch (error) {
      console.error('❌ Device upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('idle');
    } finally {
      // Allow selecting the same file again later
      e.target.value = '';
    }
  };

  const removeImage = (type: 'fridge' | 'pantry', index: number) => {
    const setImages = type === 'fridge' ? setFridgeImages : setPantryImages;
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (type: 'fridge' | 'pantry', index: number) => {
    const setImages = type === 'fridge' ? setFridgeUploadedImages : setPantryUploadedImages;
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (fridgeStatus === 'complete' && (fridgeImages.length > 0 || fridgeUploadedImages.length > 0)) {
      const imageUrls = [
        ...fridgeUploadedImages.map((img) => img.url),
        ...pantryUploadedImages.map((img) => img.url),
      ];

      // Persist in case the user refreshes /review (router state is lost on refresh)
      try {
        sessionStorage.setItem('plately:lastImageUrls', JSON.stringify(imageUrls));
      } catch {
        // ignore
      }

      const params = new URLSearchParams();
      if (fridgeSessionId) params.set('fridgeSessionId', fridgeSessionId);
      if (pantrySessionId) params.set('pantrySessionId', pantrySessionId);
      const query = params.toString();

      navigate(`/review${query ? `?${query}` : ''}`, {
        state: {
          imageUrls,
          fridgeSessionId,
          pantrySessionId,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7] py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#2ECC71] text-white flex items-center justify-center" style={{ fontWeight: 600 }}>
                1
              </div>
              <span className="text-[#2ECC71] hidden sm:inline" style={{ fontWeight: 600 }}>
                Upload
              </span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center" style={{ fontWeight: 600 }}>
                2
              </div>
              <span className="text-gray-600 hidden sm:inline" style={{ fontWeight: 500 }}>
                Review Foods
              </span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center" style={{ fontWeight: 600 }}>
                3
              </div>
              <span className="text-gray-600 hidden sm:inline" style={{ fontWeight: 500 }}>
                Generate Meals
              </span>
            </div>
          </div>
        </div>

        {/* Upload Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Fridge Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                Fridge Photo
              </h3>
              {fridgeStatus === 'complete' && (
                <div className="w-8 h-8 rounded-full bg-[#2ECC71] flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
              )}
            </div>

            {fridgeStatus === 'idle' && (
              <div className="space-y-4">
                <button
                  onClick={() => showQrForType('fridge')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-md"
                  style={{ fontWeight: 600 }}
                >
                  <QrCode size={20} />
                  Scan with QR
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <label className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#2C2C2C] border-2 border-[#2ECC71] rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                  <Upload size={20} />
                  <span style={{ fontWeight: 600 }}>Upload from device</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload('fridge', e)}
                  />
                </label>
              </div>
            )}

            {showQR === 'fridge' && fridgeSessionId && (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-xl p-8 flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QRCodeSVG 
                      value={`${frontendUrl}/mobile-upload?sessionId=${fridgeSessionId}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 mb-2">
                    Scan this QR code with your phone to upload a photo
                  </p>
                  <p className="text-xs text-gray-500">
                    Session: {fridgeSessionId.slice(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQR(null);
                  }}
                  className="w-full px-6 py-3 text-gray-600 hover:text-[#2C2C2C] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {fridgeStatus === 'received' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="text-[#2ECC71] animate-spin mb-4" size={48} />
                <p className="text-gray-600">Uploading...</p>
              </div>
            )}

            {fridgeStatus === 'complete' && (
              <div className="space-y-4">
                <div className="bg-[#2ECC71] bg-opacity-10 rounded-xl p-6 text-center">
                  <Camera className="mx-auto text-[#2ECC71] mb-2" size={48} />
                  <p className="text-[#2ECC71]" style={{ fontWeight: 600 }}>
                    {fridgeImages.length + fridgeUploadedImages.length} photo{fridgeImages.length + fridgeUploadedImages.length !== 1 ? 's' : ''} received!
                  </p>
                </div>
                
                {/* Display device-uploaded images */}
                {fridgeImages.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">From Device:</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {fridgeImages.map((img, index) => (
                        <div key={`device-${index}`} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group">
                          <img 
                            src={URL.createObjectURL(img)} 
                            alt={`Fridge ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage('fridge', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display QR-uploaded images */}
                {fridgeUploadedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">From QR Code:</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {fridgeUploadedImages.map((img, index) => (
                        <div key={`qr-${index}`} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group">
                          <img 
                            src={img.url} 
                            alt={`Fridge QR ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeUploadedImage('fridge', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-[#2C2C2C] border border-gray-300 rounded-xl hover:bg-gray-50 transition-all cursor-pointer text-sm">
                    <Upload size={18} />
                    <span style={{ fontWeight: 500 }}>Add more photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload('fridge', e)}
                    />
                  </label>

                  <button
                    onClick={() => showQrForType('fridge')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-[#2C2C2C] border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-sm"
                    style={{ fontWeight: 500 }}
                  >
                    <RefreshCw size={18} />
                    Get another QR code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pantry Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl md:text-2xl" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                  Pantry Photo
                </h3>
                <p className="text-sm text-gray-500 mt-1">(optional)</p>
              </div>
              {pantryStatus === 'complete' && (
                <div className="w-8 h-8 rounded-full bg-[#2ECC71] flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
              )}
            </div>

            {pantryStatus === 'idle' && (
              <div className="space-y-4">
                <button
                  onClick={() => showQrForType('pantry')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#F4D03F] text-[#2C2C2C] rounded-xl hover:bg-[#e8c636] transition-all shadow-md"
                  style={{ fontWeight: 600 }}
                >
                  <QrCode size={20} />
                  Scan with QR
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <label className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#2C2C2C] border-2 border-[#F4D03F] rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                  <Upload size={20} />
                  <span style={{ fontWeight: 600 }}>Upload from device</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload('pantry', e)}
                  />
                </label>
              </div>
            )}

            {showQR === 'pantry' && pantrySessionId && (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-xl p-8 flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QRCodeSVG 
                      value={`${frontendUrl}/mobile-upload?sessionId=${pantrySessionId}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 mb-2">
                    Scan this QR code with your phone to upload a photo
                  </p>
                  <p className="text-xs text-gray-500">
                    Session: {pantrySessionId.slice(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQR(null);
                  }}
                  className="w-full px-6 py-3 text-gray-600 hover:text-[#2C2C2C] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {pantryStatus === 'received' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="text-[#F4D03F] animate-spin mb-4" size={48} />
                <p className="text-gray-600">Uploading...</p>
              </div>
            )}

            {pantryStatus === 'complete' && (
              <div className="space-y-4">
                <div className="bg-[#F4D03F] bg-opacity-20 rounded-xl p-6 text-center">
                  <Camera className="mx-auto text-[#F4D03F] mb-2" size={48} />
                  <p className="text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                    {pantryImages.length + pantryUploadedImages.length} photo{pantryImages.length + pantryUploadedImages.length !== 1 ? 's' : ''} received!
                  </p>
                </div>
                
                {/* Display device-uploaded images */}
                {pantryImages.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">From Device:</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {pantryImages.map((img, index) => (
                        <div key={`device-${index}`} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group">
                          <img 
                            src={URL.createObjectURL(img)} 
                            alt={`Pantry ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage('pantry', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display QR-uploaded images */}
                {pantryUploadedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">From QR Code:</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {pantryUploadedImages.map((img, index) => (
                        <div key={`qr-${index}`} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group">
                          <img 
                            src={img.url} 
                            alt={`Pantry QR ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeUploadedImage('pantry', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-[#2C2C2C] border border-gray-300 rounded-xl hover:bg-gray-50 transition-all cursor-pointer text-sm">
                    <Upload size={18} />
                    <span style={{ fontWeight: 500 }}>Add more photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload('pantry', e)}
                    />
                  </label>

                  <button
                    onClick={() => showQrForType('pantry')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-[#2C2C2C] border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-sm"
                    style={{ fontWeight: 500 }}
                  >
                    <RefreshCw size={18} />
                    Get another QR code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 text-[#2C2C2C] hover:text-[#2ECC71] transition-colors text-center"
            style={{ fontWeight: 500 }}
          >
            Back to Home
          </Link>
          <button
            onClick={handleContinue}
            disabled={fridgeStatus !== 'complete'}
            className="px-8 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            Continue to Review
          </button>
        </div>

        {/* Help Text */}
        {fridgeStatus === 'idle' && (
          <p className="text-center text-sm text-gray-500 mt-8">
            Tip: For best results, ensure good lighting and clear visibility of items
          </p>
        )}
      </div>
    </div>
  );
}
