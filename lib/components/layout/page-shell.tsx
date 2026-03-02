import { ReactNode } from 'react';
import { Header } from './header';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  includeHeader?: boolean;
  /** Company logo URL — replaces the default Moveware logo in the header. */
  logoUrl?: string;
  companyName?: string;
}

export function PageShell({ 
  children, 
  className = '',
  includeHeader = true,
  logoUrl,
  companyName,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {includeHeader && <Header logoUrl={logoUrl} companyName={companyName} />}
      <main className={className}>
        {children}
      </main>
    </div>
  );
}
