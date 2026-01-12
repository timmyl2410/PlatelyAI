import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ChefHat } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { getOrCreateUserEntitlements, incrementMealGenerations } from '../../lib/firestoreUsers';
import { canGenerateMeal, needsReset, getRemainingGenerations } from '../../lib/entitlements';
import { UpgradeModal } from './UpgradeModal';
import { getCurrentInventory } from '../../lib/inventory';

const tips = [
  'Tip: Clearer photos improve ingredient detection accuracy',
  'Tip: Include expiration dates in your photos for freshness tracking',
  'Tip: Store herbs upright in water to keep them fresh longer',
  'Tip: Label and date your leftovers for easy meal planning',
];

export function LoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [stage, setStage] = useState<'analyzing' | 'creating'>('analyzing');
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    let cancelled = false;

    // Wait for auth to load before starting
    if (authLoading) {
      console.log('LoadingPage: Waiting for auth to load...');
      return;
    }

    console.log('LoadingPage: Auth loaded, user:', user ? user.uid : 'null');

    // Progress animation (caps at 95% until API returns)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const cap = error ? 100 : 95;
        if (prev >= cap) return prev;
        return prev + 2;
      });
    }, 60);

    // Change stage
    const stageTimeout = setTimeout(() => {
      setStage('creating');
    }, 2000);

    const run = async () => {
      try {
        setError(null);

        const ingredientsFromState = (location.state as any)?.ingredients as string[] | undefined;
        const goalFromState = (location.state as any)?.goal as string | undefined;
        const filtersFromState = (location.state as any)?.filters as string[] | undefined;
        
        const ingredientsFromStorage = (() => {
          try {
            const raw = sessionStorage.getItem('plately:lastIngredients');
            const parsed = raw ? JSON.parse(raw) : null;
            return Array.isArray(parsed) ? (parsed as string[]) : undefined;
          } catch {
            return undefined;
          }
        })();

        let ingredients = (ingredientsFromState ?? ingredientsFromStorage ?? []).filter(Boolean);

        // TODO: If no ingredients provided, try loading from saved inventory
        // This allows users to generate meals without rescanning every time
        if (ingredients.length === 0 && user) {
          try {
            console.log('📦 No ingredients provided, checking saved inventory...');
            const inventory = await getCurrentInventory(user.uid);
            if (inventory && inventory.items.length > 0) {
              ingredients = inventory.items.map(item => item.name).filter(Boolean);
              console.log(`✅ Loaded ${ingredients.length} ingredients from saved inventory`);
            }
          } catch (error) {
            console.error('❌ Failed to load saved inventory (non-blocking):', error);
            // Continue without inventory - will show error below
          }
        }

        if (ingredients.length === 0) {
          throw new Error('No ingredients found to generate meals. Go back and scan/upload a photo first.');
        }

        // Check usage limits before making the request
        if (user) {
          const entitlements = await getOrCreateUserEntitlements(user.uid);
          
          // Check if we can generate more meals
          if (!canGenerateMeal(entitlements)) {
            const remaining = getRemainingGenerations(entitlements);
            setError(`You've reached your monthly limit. ${remaining} generations remaining.`);
            setShowUpgradeModal(true);
            setProgress(100);
            return;
          }
          
          console.log('Usage check passed, proceeding with generation...');
        }

        // Get auth token if user is logged in
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (user) {
          console.log('LoadingPage: User authenticated, getting token...');
          const token = await user.getIdToken();
          console.log('LoadingPage: Token received, length:', token.length);
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.log('LoadingPage: No user found, sending unauthenticated request');
        }

        console.log('LoadingPage: Headers being sent:', Object.keys(headers));

        const resp = await fetch(`${backendUrl}/api/meals`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            ingredients,
            goal: goalFromState || 'maintain',
            filters: filtersFromState || [],
          }),
        });
        const data = await resp.json();
        
        // Handle limit reached response from backend
        if (resp.status === 403 && data.error === 'LIMIT_REACHED') {
          setError(data.message || 'Monthly limit reached');
          setShowUpgradeModal(true);
          setProgress(100);
          return;
        }
        
        if (!resp.ok) throw new Error(data?.error || 'Meal generation failed');

        if (cancelled) return;

        try {
          sessionStorage.setItem('plately:lastMeals', JSON.stringify(data?.meals || []));
          sessionStorage.setItem('plately:lastGoal', goalFromState || 'maintain');
          sessionStorage.setItem('plately:lastFilters', JSON.stringify(filtersFromState || []));
        } catch {
          // ignore
        }

        setProgress(100);
        setTimeout(() => {
          navigate('/results', { 
            state: { 
              meals: data?.meals || [],
              goal: goalFromState || 'maintain',
              filters: filtersFromState || []
            } 
          });
        }, 400);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Meal generation failed');
        setProgress(100);
      }
    };

    run();

    // Rotate tips
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
      clearTimeout(stageTimeout);
      cancelled = true;
    };
  }, [navigate, location.state, backendUrl, error, authLoading, user]);

  return (
    <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl w-full">
        {/* Main Loading Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-center">
          {/* Animated Icon */}
          <div className="mb-8 flex justify-center">
            {stage === 'analyzing' ? (
              <div className="relative">
                <Loader2
                  className="text-[#2ECC71] animate-spin"
                  size={80}
                  strokeWidth={2}
                />
                <Sparkles
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#F4D03F]"
                  size={40}
                />
              </div>
            ) : (
              <div className="relative">
                <Loader2
                  className="text-[#2ECC71] animate-spin"
                  size={80}
                  strokeWidth={2}
                />
                <ChefHat
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#F4D03F]"
                  size={40}
                />
              </div>
            )}
          </div>

          {/* Status Text */}
          <h2
            className="text-2xl md:text-3xl mb-3"
            style={{ fontWeight: 700, color: '#2C2C2C' }}
          >
            {stage === 'analyzing' ? 'Analyzing ingredients...' : 'Creating meal ideas...'}
          </h2>
          <p className="text-gray-600 mb-8">This will only take a moment</p>
          {error && (
            <p className="text-sm text-red-600 mb-6">
              {error}
            </p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2ECC71] to-[#1E8449] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Progress Percentage */}
          <p className="text-lg mb-8" style={{ fontWeight: 600, color: '#2ECC71' }}>
            {progress}%
          </p>

          {/* Rotating Tips */}
          <div className="bg-[#F9FAF7] rounded-2xl p-6 min-h-[80px] flex items-center justify-center">
            <p className="text-sm text-gray-600 transition-opacity duration-300">
              {tips[currentTip]}
            </p>
          </div>
        </div>

        {/* Fun Facts */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl mb-1" style={{ fontWeight: 700, color: '#2ECC71' }}>
              30s
            </div>
            <div className="text-xs text-gray-600">Average time</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl mb-1" style={{ fontWeight: 700, color: '#2ECC71' }}>
              5
            </div>
            <div className="text-xs text-gray-600">Meal ideas</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl mb-1" style={{ fontWeight: 700, color: '#2ECC71' }}>
              100%
            </div>
            <div className="text-xs text-gray-600">AI-powered</div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            navigate('/pricing');
          }}
          reason="limit_reached"
        />
      )}
    </div>
  );
}
