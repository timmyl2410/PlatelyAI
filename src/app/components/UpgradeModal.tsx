import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'premium_feature';
  remainingGenerations?: number;
}

export function UpgradeModal({ isOpen, onClose, reason = 'premium_feature', remainingGenerations }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {reason === 'limit_reached' ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                Monthly Limit Reached
              </h2>
              <p className="text-gray-600">
                You've used all {remainingGenerations !== undefined ? `your` : ''} meal generations for this month.
              </p>
            </div>

            <div className="bg-[#F9FAF7] rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Upgrade to Premium</strong> to unlock 150 meal generations per month, plus:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>✓ AI-generated meal images</li>
                <li>✓ Full macro nutrient breakdown</li>
                <li>✓ Recipe links & instructions</li>
                <li>✓ Advanced personalization</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                Cancel
              </button>
              <Link
                to="/pricing"
                className="flex-1 px-4 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all text-center"
                style={{ fontWeight: 600 }}
                onClick={onClose}
              >
                View Plans
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                Premium Feature
              </h2>
              <p className="text-gray-600">
                Unlock this feature and more with Premium
              </p>
            </div>

            <div className="bg-[#F9FAF7] rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Premium includes:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ 150 meal generations/month</li>
                <li>✓ AI-generated meal images</li>
                <li>✓ Full macro nutrient breakdown</li>
                <li>✓ Recipe links & instructions</li>
                <li>✓ Advanced AI personalization</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                style={{ fontWeight: 600 }}
              >
                Maybe Later
              </button>
              <Link
                to="/pricing"
                className="flex-1 px-4 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all text-center"
                style={{ fontWeight: 600 }}
                onClick={onClose}
              >
                Upgrade Now
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
