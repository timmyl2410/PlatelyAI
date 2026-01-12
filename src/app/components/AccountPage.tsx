import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, CreditCard, Bell, Shield, Camera, Mail, Lock, Trash2, Loader2, Check } from 'lucide-react';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../lib/useAuth';
import { getUserEntitlements } from '../../lib/firestoreUsers';
import { TIER_PRICES, getTierDisplayName, getTierFeatures } from '../../lib/entitlements';
import type { UserEntitlements } from '../../lib/entitlements';

type Tab = 'profile' | 'billing' | 'notifications' | 'security';

export function AccountPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('billing');
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoError, setPhotoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyRecaps, setWeeklyRecaps] = useState(true);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (!loading && !user) {
      navigate('/signin');
      return;
    }

    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
      
      // Try to load photo from localStorage first, fallback to Firebase
      try {
        const savedPhoto = localStorage.getItem(`plately:profilePhoto:${user.uid}`);
        setPhotoURL(savedPhoto || user.photoURL || '');
      } catch {
        setPhotoURL(user.photoURL || '');
      }

      // Load user entitlements
      const loadEntitlements = async () => {
        let ents = await getUserEntitlements(user.uid);
        if (!ents) {
          // If no entitlements exist, create them
          const { getOrCreateUserEntitlements } = await import('../../lib/firestoreUsers');
          ents = await getOrCreateUserEntitlements(user.uid);
        }
        setEntitlements(ents);
      };
      loadEntitlements();

      // Check if returning from Stripe checkout
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        // Wait a moment for webhook to process, then refetch
        setTimeout(async () => {
          const ents = await getUserEntitlements(user.uid);
          setEntitlements(ents);
        }, 2000);
        // Remove session_id from URL
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
        // Show billing tab
        setActiveTab('billing');
      }
    }
  }, [user, loading, navigate, searchParams, setSearchParams]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsLoading(true);
    setError('');
    setPhotoError(false);

    // Convert image to base64 data URL for display
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result as string;
        
        // Check if the data URL is valid
        if (!dataUrl || typeof dataUrl !== 'string') {
          throw new Error('Invalid image data');
        }
        
        setPhotoURL(dataUrl);

        // Save to localStorage instead of Firebase Auth (to avoid size limits)
        try {
          localStorage.setItem(`plately:profilePhoto:${user.uid}`, dataUrl);
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError);
          // Continue anyway - photo will work for this session
        }
        
        setIsLoading(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error: any) {
        console.error('Photo upload error:', error);
        const errorMessage = error?.message || error?.code || 'Unknown error';
        setError(`Failed to upload photo: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      console.error('FileReader error');
      setError('Failed to read image file. Please try again.');
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Update display name only (photo is stored in localStorage)
      const updates: { displayName?: string } = {};
      if (name !== user.displayName) {
        updates.displayName = name;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateProfile(user, updates);
      }

      // Note: Email update requires recent authentication
      // For now, we'll skip email update. You can add reauthentication flow later.
      if (email !== user.email) {
        setError('Email updates require re-authentication. Please use "Change Password" to verify your identity first.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Reauthenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setError('New password is too weak');
      } else {
        setError('Failed to change password. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // TODO: You may want to delete user data from Firestore here
        
        // Delete the Firebase auth account
        await user.delete();
        
        // User will be automatically signed out and redirected by useAuth
        navigate('/');
      } catch (error: any) {
        console.error('Delete account error:', error);
        if (error.code === 'auth/requires-recent-login') {
          setError('Please sign in again before deleting your account for security reasons.');
        } else {
          setError('Failed to delete account. Please try again.');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2ECC71]" size={40} />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
            Account Settings
          </h1>
          <p className="text-gray-600">Manage your profile, billing, and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#2ECC71] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-gray-700"
              style={{ fontWeight: 600 }}
            >
              Sign Out
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl mb-6" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                    Profile Information
                  </h2>

                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <Check size={16} />
                      Changes saved successfully!
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    {/* Avatar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Profile Picture
                      </label>
                      <div className="flex items-center gap-4">
                        {photoURL && !photoError ? (
                          <img
                            src={photoURL}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                            onError={() => setPhotoError(true)}
                            onLoad={() => setPhotoError(false)}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#1E8449] rounded-full flex items-center justify-center text-white text-2xl" style={{ fontWeight: 700 }}>
                            {name.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Camera size={16} />
                          )}
                          Change photo
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{ fontWeight: 600 }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-2xl mb-6" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                    Billing & Subscription
                  </h2>

                  {/* Current Plan */}
                  <div className="mb-8">
                    <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                      Current Plan
                    </h3>
                    <div className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xl" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                            {entitlements ? getTierDisplayName(entitlements.tier) : 'Free Plan'}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {entitlements 
                              ? `${entitlements.mealGenerationsUsed}/${entitlements.mealGenerationsLimit} meal generations used this month`
                              : '0/30 meal generations used this month'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl" style={{ fontWeight: 700, color: '#2ECC71' }}>
                            ${entitlements ? TIER_PRICES[entitlements.tier] : 0}
                          </p>
                          <p className="text-sm text-gray-600">per month</p>
                        </div>
                      </div>
                      {(!entitlements || entitlements.tier === 'free') && (
                        <button 
                          onClick={() => navigate('/pricing')}
                          className="w-full py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all" 
                          style={{ fontWeight: 600 }}
                        >
                          Upgrade to Premium
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-8">
                    <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                      Payment Methods
                    </h3>
                    <div className="text-center py-8 text-gray-500">
                      No payment methods added yet
                    </div>
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                      Billing History
                    </h3>
                    <div className="text-center py-8 text-gray-500">
                      No billing history available
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl mb-6" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive meal suggestions and updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ECC71]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ECC71]"></div>
                      </label>
                    </div>

                    {/* Marketing Emails */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Marketing Emails</h4>
                        <p className="text-sm text-gray-600">Receive tips, recipes, and special offers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marketingEmails}
                          onChange={(e) => setMarketingEmails(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ECC71]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ECC71]"></div>
                      </label>
                    </div>

                    {/* Weekly Recaps */}
                    <div className="flex items-center justify-between py-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Weekly Recaps</h4>
                        <p className="text-sm text-gray-600">Get a summary of your meals and nutrition</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weeklyRecaps}
                          onChange={(e) => setWeeklyRecaps(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ECC71]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ECC71]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl mb-6" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                    Security Settings
                  </h2>

                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <Check size={16} />
                      Password changed successfully!
                    </div>
                  )}

                  {/* Change Password */}
                  <div className="mb-8">
                    <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                      Change Password
                    </h3>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                          placeholder="At least 8 characters"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Delete Account */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg mb-4" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                      Delete Account
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      <Trash2 size={20} />
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
