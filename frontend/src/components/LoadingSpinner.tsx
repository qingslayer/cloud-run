import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'teal',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const colorClasses = {
    teal: 'border-teal-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    slate: 'border-slate-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses] || 'border-teal-500'} border-t-transparent`} />
      {text && (
        <p className={`mt-3 ${textSizeClasses[size]} font-medium text-slate-600 dark:text-slate-400`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
