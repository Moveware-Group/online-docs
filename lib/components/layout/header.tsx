'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          <div className="flex items-center">
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
          </div>
        </div>
      </nav>
    </header>
  );
}
