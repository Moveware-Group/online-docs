/**
 * RMS Page Component with Metadata Version
 * Route: /rms/[companyId]/[pageType]/[mdVersion]
 */

import { RMSClient } from '../RMSClient';

interface PageProps {
  params: Promise<{
    companyId: string;
    pageType: string;
    mdVersion: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RMSPageWithVersion({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <RMSClient
      companyId={resolvedParams.companyId}
      pageType={resolvedParams.pageType}
      mdVersion={resolvedParams.mdVersion}
      searchParams={resolvedSearchParams}
    />
  );
}
