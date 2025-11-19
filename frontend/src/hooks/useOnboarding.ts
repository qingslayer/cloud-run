import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/constants';

interface OnboardingState {
  hasSeenWelcome: boolean;
  hasUploadedFirstDocument: boolean;
  hasReviewedFirstDocument: boolean;
  hasUsedSearch: boolean;
  hasUsedChat: boolean;
  dismissedTooltips: string[];
}

const defaultState: OnboardingState = {
  hasSeenWelcome: false,
  hasUploadedFirstDocument: false,
  hasReviewedFirstDocument: false,
  hasUsedSearch: false,
  hasUsedChat: false,
  dismissedTooltips: [],
};

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(state));
  }, [state]);

  const markComplete = (milestone: keyof Omit<OnboardingState, 'dismissedTooltips'>) => {
    setState(prev => ({ ...prev, [milestone]: true }));
  };

  const dismissTooltip = (tooltipId: string) => {
    setState(prev => ({
      ...prev,
      dismissedTooltips: [...prev.dismissedTooltips, tooltipId],
    }));
  };

  const shouldShowTooltip = (tooltipId: string) => {
    return !state.dismissedTooltips.includes(tooltipId);
  };

  const resetOnboarding = () => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
  };

  return {
    state,
    markComplete,
    dismissTooltip,
    shouldShowTooltip,
    resetOnboarding,
  };
};