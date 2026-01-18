import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  X,
  Zap,
  Shield,
  BarChart3,
  Download,
  Headphones,
  FileText,
  Users,
  Code,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { paymentsApi } from '../api/payments';
import { logger } from '../utils/logger';

interface UpgradePageProps {
  onUpgradeSuccess?: () => void;
}

interface PlanFeature {
  name: string;
  basic: boolean | string;
  pro: boolean | string;
  icon: React.ReactNode;
}

const UpgradePage: React.FC<UpgradePageProps> = ({ onUpgradeSuccess }) => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const isPro = user?.plan === 'pro';
  const isActive = user?.subscription_status === 'active' || user?.subscription_status === 'trialing';

  // Check for successful payment redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');

    if (paymentSuccess === 'true') {
      // Update user plan to pro
      updateUser({ plan: 'pro', subscription_status: 'active' });

      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);

      if (onUpgradeSuccess) {
        onUpgradeSuccess();
      }
    }
  }, [updateUser, onUpgradeSuccess]);

  const features: PlanFeature[] = [
    {
      name: 'Patient Management',
      basic: true,
      pro: true,
      icon: <Users size={18} />
    },
    {
      name: 'Clinical Notes',
      basic: true,
      pro: true,
      icon: <FileText size={18} />
    },
    {
      name: 'AI Summaries',
      basic: 'Limited (5/day)',
      pro: 'Unlimited',
      icon: <Sparkles size={18} />
    },
    {
      name: 'Analytics Dashboard',
      basic: false,
      pro: true,
      icon: <BarChart3 size={18} />
    },
    {
      name: 'Data Export',
      basic: false,
      pro: true,
      icon: <Download size={18} />
    },
    {
      name: 'Priority Support',
      basic: false,
      pro: true,
      icon: <Headphones size={18} />
    },
    {
      name: 'Custom Reports',
      basic: false,
      pro: true,
      icon: <FileText size={18} />
    },
    {
      name: 'Team Collaboration',
      basic: false,
      pro: true,
      icon: <Users size={18} />
    },
    {
      name: 'API Access',
      basic: false,
      pro: true,
      icon: <Code size={18} />
    }
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUrl = window.location.origin + window.location.pathname;

      const response = await paymentsApi.createCheckoutSession({
        plan: 'pro',
        success_url: `${currentUrl}?payment_success=true`,
        cancel_url: currentUrl
      });

      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
    } catch (err: any) {
      logger.error('Failed to create checkout session', err);

      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || 'Invalid request. Please try again.');
      } else {
        setError('Failed to start checkout. Please try again later.');
      }
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    setError(null);

    try {
      const response = await paymentsApi.createBillingPortalSession();
      window.location.href = response.portal_url;
    } catch (err: any) {
      logger.error('Failed to open billing portal', err);
      setError('Failed to open billing portal. Please try again.');
      setIsManagingSubscription(false);
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-sm font-medium text-gray-700">{value}</span>;
    }
    return value ? (
      <Check className="text-green-500" size={20} />
    ) : (
      <X className="text-gray-300" size={20} />
    );
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full mb-6">
          <Crown className="text-amber-500" size={20} />
          <span className="text-amber-700 font-bold text-sm">Upgrade to Pro</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Unlock the Full Power of HealLog
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Get unlimited AI summaries, advanced analytics, and premium features to streamline your practice.
        </p>
      </div>

      {/* Current Plan Status */}
      {isPro && isActive && (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="text-white" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Pro Plan Active</h3>
                  <CheckCircle className="text-green-500" size={18} />
                </div>
                <p className="text-sm text-gray-500">
                  {user?.subscription_end_date
                    ? `Renews on ${new Date(user.subscription_end_date).toLocaleDateString()}`
                    : 'You have access to all Pro features'}
                </p>
              </div>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={isManagingSubscription}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              {isManagingSubscription ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                'Manage Subscription'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Basic Plan */}
        <div className={`bg-white rounded-3xl border-2 p-8 ${!isPro ? 'border-brand-500 ring-4 ring-brand-100' : 'border-gray-200'}`}>
          {!isPro && (
            <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-full mb-4">
              CURRENT PLAN
            </div>
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-gray-900">$0</span>
            <span className="text-gray-500">/month</span>
          </div>
          <p className="text-gray-500 mb-6">Essential features to get started with patient management.</p>

          <ul className="space-y-3 mb-8">
            {features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  {typeof feature.basic === 'boolean' ? (
                    feature.basic ? <Check size={12} className="text-gray-600" /> : <X size={12} className="text-gray-400" />
                  ) : (
                    <Check size={12} className="text-gray-600" />
                  )}
                </div>
                <span className="text-gray-700">{feature.name}</span>
                {typeof feature.basic === 'string' && (
                  <span className="text-xs text-gray-400 ml-auto">{feature.basic}</span>
                )}
              </li>
            ))}
          </ul>

          {!isPro && (
            <button
              disabled
              className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-bold cursor-not-allowed"
            >
              Current Plan
            </button>
          )}
        </div>

        {/* Pro Plan */}
        <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden ${isPro && isActive ? 'ring-4 ring-amber-400' : ''}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 text-xs font-bold rounded-full mb-4">
              <Zap size={12} />
              {isPro && isActive ? 'YOUR PLAN' : 'MOST POPULAR'}
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 mb-6">Everything in Basic plus advanced features for growing practices.</p>

            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? <Check size={12} className="text-amber-400" /> : <X size={12} className="text-gray-500" />
                    ) : (
                      <Check size={12} className="text-amber-400" />
                    )}
                  </div>
                  <span className="text-gray-200">{feature.name}</span>
                  {typeof feature.pro === 'string' && (
                    <span className="text-xs text-amber-400 ml-auto">{feature.pro}</span>
                  )}
                </li>
              ))}
            </ul>

            {isPro && isActive ? (
              <button
                onClick={handleManageSubscription}
                disabled={isManagingSubscription}
                className="w-full py-3 px-4 bg-white/10 backdrop-blur text-white rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isManagingSubscription ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Manage Subscription
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 rounded-xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Redirecting to Checkout...
                  </>
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Feature Comparison</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-900">Feature</th>
                <th className="text-center px-6 py-4 text-sm font-bold text-gray-900 w-32">Basic</th>
                <th className="text-center px-6 py-4 text-sm font-bold text-gray-900 w-32 bg-amber-50">
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="text-amber-500" size={16} />
                    Pro
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">{feature.icon}</div>
                      <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    {renderFeatureValue(feature.basic)}
                  </td>
                  <td className="text-center px-6 py-4 bg-amber-50/50">
                    {renderFeatureValue(feature.pro)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ / Trust Section */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="text-green-500" size={18} />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" size={18} />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="text-brand-500" size={18} />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
