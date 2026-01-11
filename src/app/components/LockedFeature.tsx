import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LockedFeatureProps {
  featureName: string;
  className?: string;
  showUpgradeLink?: boolean;
}

export function LockedFeature({ featureName, className = '', showUpgradeLink = true }: LockedFeatureProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl ${className}`}>
      <Lock size={32} className="text-gray-400 mb-2" />
      <p className="text-sm font-semibold text-gray-600 mb-1">{featureName}</p>
      <p className="text-xs text-gray-500 mb-3">Premium Feature</p>
      {showUpgradeLink && (
        <Link
          to="/pricing"
          className="px-4 py-2 bg-[#2ECC71] text-white text-sm rounded-lg hover:bg-[#1E8449] transition-all"
          style={{ fontWeight: 600 }}
        >
          Upgrade to Premium
        </Link>
      )}
    </div>
  );
}
