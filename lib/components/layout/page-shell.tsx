import { ReactNode } from 'react';
import { Header } from './header';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  includeHeader?: boolean;
}

export function PageShell({ 
  children, 
  className = '',
  includeHeader = true 
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {includeHeader && <Header />}
      <main className={className}>
        {children}
      </main>
    </div>
  );
}
