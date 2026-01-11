import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Settings, LogOut, ChevronDown, FileText } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../lib/useAuth';
import { UsageDisplay } from './UsageDisplay';

export function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [hasSavedMeals, setHasSavedMeals] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState('');

  // Check if there are saved meals in sessionStorage
  useEffect(() => {
    const checkSavedMeals = () => {
      try {
        const raw = sessionStorage.getItem('plately:lastMeals');
        const parsed = raw ? JSON.parse(raw) : null;
        setHasSavedMeals(Array.isArray(parsed) && parsed.length > 0);
      } catch {
        setHasSavedMeals(false);
      }
    };
    
    checkSavedMeals();
    // Recheck when window regains focus (in case meals were generated in another tab)
    window.addEventListener('focus', checkSavedMeals);
    return () => window.removeEventListener('focus', checkSavedMeals);
  }, []);

  // Load profile photo from localStorage
  useEffect(() => {
    if (user) {
      try {
        const savedPhoto = localStorage.getItem(`plately:profilePhoto:${user.uid}`);
        setProfilePhotoURL(savedPhoto || '');
      } catch {
        setProfilePhotoURL('');
      }
    } else {
      setProfilePhotoURL('');
    }
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/PlatelyAI Logo.png" alt="PlatelyAI" className="h-8 md:h-10" />
            <span className="text-xl md:text-2xl" style={{ fontWeight: 600, color: '#2C2C2C' }}>
              PlatelyAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors">
              Home
            </Link>
            <Link to="/how-it-works" className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors">
              How it Works
            </Link>
            <Link to="/pricing" className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors">
              About
            </Link>
            
            {/* View Last Results Button */}
            {hasSavedMeals && (
              <Link
                to="/results"
                className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-sm"
                style={{ fontWeight: 600 }}
              >
                <FileText size={16} />
                <span>My Results</span>
              </Link>
            )}

            {/* Auth Buttons or User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all"
                >
                  {profilePhotoURL ? (
                    <img
                      src={profilePhotoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      onError={() => setProfilePhotoURL('')}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#2ECC71] to-[#1E8449] rounded-full flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <ChevronDown size={16} className="text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user.displayName || 'User'}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    {/* Usage Display */}
                    <div className="px-4 py-3">
                      <UsageDisplay />
                    </div>
                    
                    <Link
                      to="/account"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 border-t border-gray-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={16} />
                      Account Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 border-t border-gray-200 mt-1 pt-2"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/signin"
                  className="px-5 py-2.5 text-[#2C2C2C] hover:text-[#2ECC71] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-sm hover:shadow-md"
                  style={{ fontWeight: 500 }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#2C2C2C]"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/how-it-works"
                className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link
                to="/pricing"
                className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-[#2C2C2C] hover:text-[#2ECC71] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>

              {/* Mobile Auth */}
              {user ? (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2ECC71] to-[#1E8449] rounded-full flex items-center justify-center text-white" style={{ fontWeight: 600 }}>
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName || 'User'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/account"
                      className="flex items-center gap-2 px-4 py-2 text-[#2C2C2C] hover:text-[#2ECC71] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings size={18} />
                      Account Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[#2C2C2C] hover:text-[#2ECC71] transition-colors"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="px-6 py-2.5 border border-[#2ECC71] text-[#2ECC71] rounded-xl hover:bg-[#2ECC71] hover:text-white transition-all text-center"
                    style={{ fontWeight: 500 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-2.5 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all text-center shadow-sm"
                    style={{ fontWeight: 500 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
