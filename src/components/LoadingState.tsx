/**
 * Loading State Component
 * Displays loading animation with localized message
 */

'use client';

import { getBrowserLanguage } from '@/lib/utils';
import { LOADING_MESSAGES } from '@/lib/constants';

export const LoadingState = () => {
  const lang = getBrowserLanguage();
  const message = LOADING_MESSAGES[lang] || LOADING_MESSAGES.en;

  return (
    <div className="overlay bg-white flex-col flex-items-center flex-content-center flex-gap">
      <h3 className="loading-message">{message}</h3>
      <div className="loader" />
    </div>
  );
};
