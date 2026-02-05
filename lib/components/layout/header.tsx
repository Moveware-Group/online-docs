'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { brandingService } from '@/lib/services';
import type { BrandingSettings } from '@/lib/types/settings';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Getting Started', href: '/getting-started' },
  { label: 'About', href: '/about' },
];

export function Header() {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Fetch branding data
    async function loadBranding() {
      try {
        const data = await brandingService.getBranding();
        setBranding(data);
      } catch (error) {
        console.error('Failed to load branding:', error);
      }
    }
    loadBranding();

    // Handle scroll for header shadow effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Use branding data or fallback to defaults
  const companyName = branding?.companyName || 'Moveware';
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || '#2563eb';

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-200 ${
          isScrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Company Name */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-3 transition-opacity hover:opacity-80"
                onClick={closeMenu}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${companyName} logo`}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {companyName.charAt(0)}
                  </div>
                )}
                <span className="text-xl font-bold text-gray-900">
                  {companyName}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="ml-4 rounded-md px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: primaryColor }}
              >
                Contact Us
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={toggleMenu}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
              >
                {/* Hamburger Icon */}
                <svg
                  className={`h-6 w-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-1 border-t border-gray-200 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={closeMenu}
              className="mt-2 block rounded-md px-4 py-3 text-center text-base font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              style={{ backgroundColor: primaryColor }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
