/**
 * Home Page
 * Root page - redirects or shows welcome message
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // In the original Angular app, the home page was commented out
  // and all traffic went to specific RMS routes
  // You can customize this behavior as needed

  return (
    <div className="not-found-container">
      <h1 className="not-found-title">OnlineAccess</h1>
      <h2 className="not-found-subtitle">Welcome</h2>
      <p className="not-found-message">
        This is the OnlineAccess application. Please use a valid URL with company and page type parameters.
      </p>
      <p className="not-found-message" style={{ marginTop: '1rem' }}>
        Example: <code>/rms/[companyId]/[pageType]</code>
      </p>
    </div>
  );
}
