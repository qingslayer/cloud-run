import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Full-page or section loading state with spinner and optional message
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullScreen = false
}) => {
  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-[#0B1120]">
        <LoadingSpinner size="lg" text={message} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="md" text={message} />
    </div>
  );
};

export default LoadingState;
