/**
 * Error Page
 * Next.js App Router error boundary
 */

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="not-found-container">
      <h1 className="not-found-title">Error</h1>
      <h2 className="not-found-subtitle">Something went wrong</h2>
      <p className="not-found-message">
        An unexpected error occurred. Please try again later.
      </p>
      {error.digest && (
        <p className="error-code" style={{ marginTop: '1rem' }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--color-sf-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
