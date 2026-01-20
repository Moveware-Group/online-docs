/**
 * RMS Page Component
 * Main dynamic page for rendering company-specific forms and documents
 * Route: /rms/[companyId]/[pageType]
 */

import { RMSClient } from './RMSClient';

interface PageProps {
  params: Promise<{
    companyId: string;
    pageType: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RMSPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <RMSClient
      companyId={resolvedParams.companyId}
      pageType={resolvedParams.pageType}
      searchParams={resolvedSearchParams}
    />
  );
}
