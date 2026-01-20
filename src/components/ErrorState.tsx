/**
 * Error State Component
 * Displays error messages with localized content
 */

'use client';

import type { ErrorResponse } from '@/types';
import { getBrowserLanguage } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants';

interface ErrorStateProps {
  error: ErrorResponse;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const lang = getBrowserLanguage();
  const messages = ERROR_MESSAGES[lang] || ERROR_MESSAGES.en;

  return (
    <div className="overlay bg-white flex-col flex-content-center flex-items-center">
      <div className="error-container flex-col">
        <div className="error-content">
          <h1 className="color-primary error-title">
            {messages.title}
          </h1>
          <h3 className="pad-b-lg error-message">
            {messages.message}
          </h3>
          {error.code !== 0 && (
            <p className="error-code">
              Error code: {error.code}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
