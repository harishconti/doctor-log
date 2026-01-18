import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton component with configurable variants and animations
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-xl';
      case 'text':
        return 'rounded';
      default:
        return '';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';
      case 'none':
        return '';
      default:
        return 'animate-pulse';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`bg-gray-200 ${getVariantClasses()} ${getAnimationClasses()} ${className}`}
      style={style}
    />
  );
};

/**
 * Skeleton for text content with multiple lines
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 3, className = '', lastLineWidth = '60%' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className="h-4"
        width={i === lines - 1 ? lastLineWidth : '100%'}
      />
    ))}
  </div>
);

/**
 * Skeleton for stat/KPI cards
 */
export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${className}`}>
    <div className="flex items-center gap-5">
      <Skeleton variant="rounded" className="w-14 h-14 shrink-0" />
      <div className="flex-1">
        <Skeleton variant="text" className="h-3 w-20 mb-2" />
        <Skeleton variant="text" className="h-8 w-16" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for patient list items
 */
export const SkeletonPatientItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    <div className="flex items-center gap-6">
      <Skeleton variant="circular" className="w-14 h-14 shrink-0" />
      <div className="flex-1">
        <Skeleton variant="text" className="h-5 w-32 mb-2" />
        <Skeleton variant="text" className="h-4 w-24" />
      </div>
      <Skeleton variant="rounded" className="h-8 w-20" />
    </div>
  </div>
);

/**
 * Skeleton for charts
 */
export const SkeletonChart: React.FC<{
  height?: number;
  className?: string;
}> = ({ height = 300, className = '' }) => (
  <div className={`flex flex-col ${className}`} style={{ height }}>
    <div className="flex items-end justify-between h-full gap-3 px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t animate-pulse"
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
    <div className="flex justify-between mt-4 px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-3 w-8" />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for line chart with legend
 */
export const SkeletonLineChart: React.FC<{
  height?: number;
  className?: string;
}> = ({ height = 300, className = '' }) => (
  <div className={`relative ${className}`} style={{ height }}>
    {/* Y-axis labels */}
    <div className="absolute left-0 top-0 bottom-12 w-8 flex flex-col justify-between">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-3 w-6" />
      ))}
    </div>
    {/* Chart area */}
    <div className="ml-10 h-full pb-12 flex items-center justify-center">
      <div className="w-full h-3/4 relative">
        {/* Horizontal grid lines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full border-t border-gray-100"
            style={{ top: `${i * 33}%` }}
          />
        ))}
        {/* Animated line placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton variant="rounded" className="h-2 w-3/4" />
        </div>
      </div>
    </div>
    {/* X-axis labels */}
    <div className="absolute bottom-0 left-10 right-0 flex justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-3 w-12" />
      ))}
    </div>
    {/* Legend */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-3 h-3" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-3 h-3" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for profile card
 */
export const SkeletonProfileCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center ${className}`}>
    <Skeleton variant="circular" className="w-32 h-32 mx-auto mb-4" />
    <Skeleton variant="text" className="h-6 w-32 mx-auto mb-2" />
    <Skeleton variant="text" className="h-4 w-20 mx-auto mb-1" />
    <Skeleton variant="text" className="h-3 w-24 mx-auto" />
    <div className="mt-8 space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" className="h-14 w-full" />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for activity timeline item
 */
export const SkeletonActivityItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 ${className}`}>
    <Skeleton variant="rounded" className="w-10 h-10 shrink-0" />
    <Skeleton variant="text" className="h-4 w-28 flex-1" />
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-8 h-8" />
      <Skeleton variant="text" className="h-4 w-24" />
    </div>
    <Skeleton variant="text" className="h-4 w-32" />
    <Skeleton variant="rounded" className="h-6 w-20" />
  </div>
);

/**
 * Skeleton for table rows
 */
export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 5, className = '' }) => (
  <div className={`flex items-center gap-8 p-4 ${className}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={`h-4 ${i === 0 ? 'w-48' : i === 1 ? 'w-24' : 'w-16'}`}
      />
    ))}
  </div>
);

/**
 * Skeleton for department/progress bar
 */
export const SkeletonProgressBar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`mb-6 last:mb-0 ${className}`}>
    <div className="flex justify-between items-end mb-2">
      <div>
        <Skeleton variant="text" className="h-4 w-24 mb-1" />
        <Skeleton variant="text" className="h-3 w-20" />
      </div>
      <Skeleton variant="text" className="h-4 w-8" />
    </div>
    <Skeleton variant="rounded" className="h-2 w-full" />
  </div>
);

/**
 * Skeleton for profile info section
 */
export const SkeletonProfileInfo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-8 ${className}`}>
    {/* Section header */}
    <div className="flex items-center gap-3 mb-6">
      <Skeleton variant="rounded" className="w-10 h-10" />
      <Skeleton variant="text" className="h-5 w-40" />
    </div>

    {/* Info grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Skeleton variant="text" className="h-3 w-20 mb-2" />
          <Skeleton variant="text" className="h-5 w-32" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton for the full patients page
 */
export const SkeletonPatientsPage: React.FC = () => (
  <div className="space-y-8 animate-fadeIn">
    {/* Header */}
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton variant="text" className="h-4 w-48 mb-2" />
        <Skeleton variant="text" className="h-8 w-64" />
      </div>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="w-full" />
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" className="h-12 w-full md:w-96" />
          <Skeleton variant="rounded" className="h-12 w-36" />
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>

    {/* Tabs */}
    <div className="flex gap-4 border-b border-gray-200 pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-4 w-20" />
      ))}
    </div>

    {/* List */}
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonPatientItem key={i} />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for the full analytics page
 */
export const SkeletonAnalyticsPage: React.FC = () => (
  <div className="space-y-8 animate-fadeIn">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <Skeleton variant="text" className="h-8 w-48 mb-2" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" className="h-10 w-32" />
        <Skeleton variant="rounded" className="h-10 w-32" />
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton variant="text" className="h-5 w-48 mb-2" />
            <Skeleton variant="text" className="h-4 w-36" />
          </div>
          <div className="flex gap-3">
            <Skeleton variant="rounded" className="h-6 w-12" />
            <Skeleton variant="rounded" className="h-6 w-24" />
          </div>
        </div>
        <SkeletonLineChart height={300} />
      </div>
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <Skeleton variant="text" className="h-5 w-40" />
          <Skeleton variant="circular" className="w-5 h-5" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonProgressBar key={i} />
          ))}
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-100">
        <Skeleton variant="text" className="h-5 w-48 mb-2" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton for the full profile page
 */
export const SkeletonProfilePage: React.FC = () => (
  <div className="space-y-8 animate-fadeIn">
    {/* Header */}
    <div className="flex justify-between items-start md:items-center">
      <div>
        <Skeleton variant="text" className="h-8 w-32 mb-2" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>
      <Skeleton variant="rounded" className="h-10 w-32" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column */}
      <div className="lg:col-span-2">
        <SkeletonProfileInfo />
      </div>

      {/* Right column */}
      <div className="space-y-8">
        <SkeletonProfileCard />
        <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6">
          <div className="flex justify-between mb-3">
            <Skeleton variant="text" className="h-4 w-36" />
            <Skeleton variant="text" className="h-4 w-8" />
          </div>
          <Skeleton variant="rounded" className="h-2.5 w-full mb-3" />
          <Skeleton variant="text" className="h-3 w-48 mx-auto" />
        </div>
      </div>
    </div>

    {/* Activity History */}
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center">
        <div>
          <Skeleton variant="text" className="h-5 w-36 mb-2" />
          <Skeleton variant="text" className="h-4 w-56" />
        </div>
        <Skeleton variant="rounded" className="h-10 w-64" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonActivityItem key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
