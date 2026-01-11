import { Link } from 'react-router-dom';
import { Check, Sparkles, Zap, Crown, Bell } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { useState, useEffect } from 'react';
import { getUserEntitlements, addToProWaitlist, updateUserTier } from '../../lib/firestoreUsers';
import { getTierFeatures, TIER_PRICES } from '../../lib/entitlements';
import type { UserEntitlements } from '../../lib/entitlements';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';
const stripeEnabled = !!(import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;

export function PricingPage() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getUserEntitlements(user.uid).then(setEntitlements);
    }
  }, [user]);

  const handleUpgradeToPremium = async () => {
    if (!user?.uid) {
      alert('Please sign in to upgrade');
      return;
    }

    setLoading(true);
    try {
      if (stripeEnabled) {
        // Production: Use Stripe
        const response = await fetch(`${backendUrl}/api/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            userEmail: user.email,
            priceId: (import.meta as any).env?.VITE_STRIPE_PREMIUM_PRICE_ID,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // DEV MODE: Simulate successful upgrade
        if (confirm('DEV MODE: Upgrade to Premium? This will update your tier immediately.')) {
          await updateUserTier(user.uid, 'premium');
          const updated = await getUserEntitlements(user.uid);
          setEntitlements(updated);
          alert('✓ Upgraded to Premium! Refresh the page to see changes.');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed. Please try again.');
      setLoading(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!user?.uid) {
      alert('Please sign in to join the waitlist');
      return;
    }

    setLoading(true);
    try {
      await addToProWaitlist(user.uid, user.email || null);
      setNotifySuccess(true);
      setTimeout(() => setNotifySuccess(false), 3000);
    } catch (error) {
      console.error('Waitlist signup failed:', error);
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      tier: 'free' as const,
      price: TIER_PRICES.free,
      description: 'Perfect for trying out PlatelyAI',
      icon: Sparkles,
      features: getTierFeatures('free'),
      cta: 'Get Started Free',
      ctaLink: '/upload',
      popular: false,
      comingSoon: false,
    },
    {
      name: 'Premium',
      tier: 'premium' as const,
      price: TIER_PRICES.premium,
      description: 'For serious meal planners',
      icon: Zap,
      features: getTierFeatures('premium'),
      cta: 'Upgrade to Premium',
      ctaAction: handleUpgradeToPremium,
      popular: true,
      comingSoon: false,
    },
    {
      name: 'Pro',
      tier: 'pro' as const,
      price: TIER_PRICES.pro,
      description: 'Ultimate meal planning experience',
      icon: Crown,
      features: getTierFeatures('pro'),
      cta: 'Notify Me',
      ctaAction: handleNotifyMe,
      popular: false,
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl mb-4"
          style={{ fontWeight: 700, color: '#2C2C2C' }}
        >
          Simple, transparent{' '}
          <span style={{ color: '#2ECC71' }}>pricing</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Start free, upgrade when you need more. All plans include smart ingredient scanning.
        </p>
      </section>

      {/* Success Message */}
      {notifySuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-semibold">✓ You're on the waitlist! We'll notify you when Pro launches.</p>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentTier = entitlements?.tier === plan.tier;
            
            return (
              <div
                key={plan.tier}
                className={`relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all ${
                  plan.popular ? 'border-4 border-[#2ECC71] md:scale-105' : ''
                } ${isCurrentTier ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#2ECC71] text-white px-6 py-1.5 rounded-full text-sm" style={{ fontWeight: 600 }}>
                      Most Popular
                    </div>
                  </div>
                )}

                {plan.comingSoon && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs" style={{ fontWeight: 600 }}>
                      COMING SOON
                    </div>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-4 left-4">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs" style={{ fontWeight: 600 }}>
                      CURRENT PLAN
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-[#2ECC71]" size={32} />
                  </div>
                  <h3 className="text-2xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  {plan.comingSoon ? (
                    <div className="text-4xl font-bold text-gray-400 mb-2">Coming Soon</div>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                        ${plan.price}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check className="text-[#2ECC71]" size={20} />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.ctaLink ? (
                  <Link
                    to={plan.ctaLink}
                    className={`block w-full text-center px-6 py-4 rounded-xl transition-all shadow-md hover:shadow-lg ${
                      isCurrentTier
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-100 text-[#2C2C2C] hover:bg-gray-200'
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {isCurrentTier ? 'Current Plan' : plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={plan.ctaAction}
                    disabled={loading || isCurrentTier}
                    className={`w-full px-6 py-4 rounded-xl transition-all shadow-md hover:shadow-lg ${
                      plan.comingSoon
                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        : plan.popular
                        ? 'bg-[#2ECC71] text-white hover:bg-[#1E8449]'
                        : 'bg-gray-100 text-[#2C2C2C] hover:bg-gray-200'
                    } ${(loading || isCurrentTier) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ fontWeight: 600 }}
                  >
                    {loading ? '...' : isCurrentTier ? 'Current Plan' : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          All prices in USD. Premium upgrade is instant in DEV mode. Production will use Stripe.
        </p>
      </section>

      {/* Features Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl md:text-4xl text-center mb-12"
            style={{ fontWeight: 700, color: '#2C2C2C' }}
          >
            Everything you need to meal plan smarter
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-[#2ECC71]" size={32} />
              </div>
              <h3 className="text-xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                AI-Powered Scanning
              </h3>
              <p className="text-gray-600">
                Snap a photo of your fridge and our AI identifies every ingredient
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="text-[#2ECC71]" size={32} />
              </div>
              <h3 className="text-xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                Personalized Meals
              </h3>
              <p className="text-gray-600">
                Get recipes matched to your ingredients, goals, and dietary needs
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="text-[#2ECC71]" size={32} />
              </div>
              <h3 className="text-xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                Nutrition Tracking
              </h3>
              <p className="text-gray-600">
                See full macro breakdowns and compare meals to optimize your diet
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
