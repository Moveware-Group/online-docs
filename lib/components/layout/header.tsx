'use client';

import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  /** When provided, replaces the default Moveware logo with the company logo. */
  logoUrl?: string;
  companyName?: string;
}

export function Header({ logoUrl, companyName }: HeaderProps = {}) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          <div className="flex items-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName ?? 'Company logo'}
                className="h-8 w-auto"
              />
            ) : (
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/images/moveware-logo.svg"
                  alt="Moveware"
                  width={180}
                  height={33}
                  priority
                  className="h-8 w-auto"
                />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
