import { useAuth } from '../../lib/useAuth';
import { useEffect, useState } from 'react';
import { getUserEntitlements } from '../../lib/firestoreUsers';
import type { UserEntitlements } from '../../lib/entitlements';
import { getTierDisplayName } from '../../lib/entitlements';
import { Link } from 'react-router-dom';

export function UsageDisplay() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getUserEntitlements(user.uid).then((data) => {
        setEntitlements(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading || !entitlements) return null;

  const percentage = (entitlements.mealGenerationsUsed / entitlements.mealGenerationsLimit) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Monthly Usage</span>
        <span className="text-xs px-2 py-1 bg-[#2ECC71] text-white rounded-full" style={{ fontWeight: 600 }}>
          {getTierDisplayName(entitlements.tier)}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-bold text-gray-900">{entitlements.mealGenerationsUsed}</span>
          <span className="text-sm text-gray-500">/ {entitlements.mealGenerationsLimit}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isNearLimit ? 'bg-yellow-500' : 'bg-[#2ECC71]'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Resets on {entitlements.nextResetAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      {entitlements.tier === 'free' && isNearLimit && (
        <Link
          to="/pricing"
          className="block w-full text-center px-3 py-2 bg-[#2ECC71] text-white text-sm rounded-lg hover:bg-[#1E8449] transition-all"
          style={{ fontWeight: 600 }}
        >
          Upgrade for More
        </Link>
      )}
    </div>
  );
}
