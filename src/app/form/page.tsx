/**
 * Form Page
 * Legacy route support for /form
 * This route existed in the original Angular app
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseLegacyQueryParams } from '@/lib/api-config';
import { LoadingState } from '@/components/LoadingState';

export default function FormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Convert URLSearchParams to QueryParams object
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Parse legacy query parameters
    const parsed = parseLegacyQueryParams(queryParams);

    // If we have company and page type, redirect to the proper RMS route
    if (parsed.companyId && parsed.pageType) {
      const newSearchParams = new URLSearchParams(parsed.params);
      router.replace(
        `/rms/${parsed.companyId}/${parsed.pageType}?${newSearchParams.toString()}`
      );
    } else {
      // If no valid params, redirect to home
      router.replace('/');
    }
  }, [searchParams, router]);

  return <LoadingState />;
}
