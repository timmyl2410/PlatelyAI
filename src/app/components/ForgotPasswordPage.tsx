import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Failed to send reset email. Please try again');
      }
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setEmail('');
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/PlatelyAI Logo.png" alt="PlatelyAI" className="h-12 mx-auto" />
            </Link>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-[#2ECC71]" size={32} />
            </div>

            <h2 className="text-2xl mb-3" style={{ fontWeight: 700, color: '#2C2C2C' }}>
              Check your email
            </h2>

            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to{' '}
              <span className="font-medium text-[#2C2C2C]">{email}</span>
            </p>

            <div className="space-y-3">
              <Link
                to="/signin"
                className="block w-full py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl"
                style={{ fontWeight: 600 }}
              >
                Back to Sign In
              </Link>

              <button
                onClick={handleRetry}
                className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                Try another email
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleRetry}
                className="text-[#2ECC71] hover:text-[#1E8449] font-medium"
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/PlatelyAI Logo.png" alt="PlatelyAI" className="h-12 mx-auto" />
          </Link>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#2ECC71] mb-6"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>

          <h2 className="text-2xl mb-3" style={{ fontWeight: 700, color: '#2C2C2C' }}>
            Forgot password?
          </h2>

          <p className="text-gray-600 mb-6">
            No worries, we'll send you reset instructions to your email.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sending...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
