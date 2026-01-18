import React from 'react';
import {
  Lock,
  Crown,
  Zap,
  BarChart3,
  Download,
  Users,
  FileText,
  Code,
  Headphones,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ViewState } from '../types';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  onUpgrade: () => void;
}

// Feature-specific icons and descriptions
const featureDetails: Record<string, { icon: React.ElementType; description: string }> = {
  'Analytics Dashboard': {
    icon: BarChart3,
    description: 'Get detailed insights into patient trends, treatment outcomes, and practice performance with interactive charts and reports.'
  },
  'Data Export': {
    icon: Download,
    description: 'Export your patient data, analytics, and reports in CSV, PDF, or Excel formats for external analysis and record-keeping.'
  },
  'Custom Reports': {
    icon: FileText,
    description: 'Create custom reports tailored to your practice needs with flexible filters, date ranges, and visualization options.'
  },
  'Team Collaboration': {
    icon: Users,
    description: 'Invite team members, share patient notes, assign tasks, and collaborate seamlessly across your practice.'
  },
  'API Access': {
    icon: Code,
    description: 'Integrate HealLog with your existing systems using our comprehensive REST API for automated workflows.'
  },
  'Priority Support': {
    icon: Headphones,
    description: 'Get priority access to our support team with faster response times and dedicated assistance.'
  },
  'Unlimited AI Summaries': {
    icon: Sparkles,
    description: 'Generate unlimited AI-powered clinical summaries and insights for all your patients without daily limits.'
  }
};

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, description, onUpgrade }) => {
  const details = featureDetails[feature] || {
    icon: Lock,
    description: description || 'This feature is available exclusively for Pro plan subscribers.'
  };

  const FeatureIcon = details.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fadeIn">
      <div className="max-w-lg w-full mx-auto text-center px-4">
        {/* Lock Icon with Feature Icon */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center shadow-inner">
            <FeatureIcon className="text-gray-400" size={40} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
            <Lock className="text-white" size={18} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {feature} is a Pro Feature
        </h2>

        {/* Description */}
        <p className="text-gray-500 mb-8 leading-relaxed">
          {details.description}
        </p>

        {/* Benefits List */}
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="text-amber-500" size={16} />
            Pro Plan Includes:
          </h3>
          <ul className="space-y-3">
            {[
              'Unlimited AI-powered summaries',
              'Full Analytics Dashboard',
              'Data Export (CSV, PDF, Excel)',
              'Custom Reports & Insights',
              'Team Collaboration Tools',
              'Priority Support'
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="text-green-600" size={12} />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 rounded-xl font-bold shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-200/60 transition-all active:scale-[0.98]"
          >
            <Crown size={20} />
            Upgrade to Pro - $29/month
            <ArrowRight size={18} />
          </button>

          <p className="text-xs text-gray-400">
            Cancel anytime. No long-term commitment required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
