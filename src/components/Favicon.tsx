/**
 * Dynamic Favicon Component
 * Updates the favicon dynamically based on metadata
 */

'use client';

import { useEffect } from 'react';

interface FaviconProps {
  href?: string;
}

export const Favicon = ({ href }: FaviconProps) => {
  useEffect(() => {
    if (!href) return;

    // Find existing favicon link or create new one
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = href;

    return () => {
      // Cleanup is optional - favicon typically persists
    };
  }, [href]);

  return null;
};
