/**
 * RMS Client Component
 * Client-side component that handles data fetching and rendering
 */

'use client';

import { useEffect, useState } from 'react';
import type { QueryParams } from '@/types';
import { ApiConfigBuilder } from '@/lib/api-config';
import { useRMSData } from '@/hooks/useRMSData';
import { useMonitoring } from '@/hooks/useMonitoring';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { DynamicContainer } from '@/components/DynamicContainer';
import { Toast } from '@/components/Toast';
import { Favicon } from '@/components/Favicon';

interface RMSClientProps {
  companyId: string;
  pageType: string;
  mdVersion?: string;
  searchParams: QueryParams;
}

export const RMSClient = ({
  companyId,
  pageType,
  mdVersion,
  searchParams,
}: RMSClientProps) => {
  const { logPageView } = useMonitoring();

  // Build API configuration from route params
  const apiConfigBuilder = new ApiConfigBuilder(
    { companyId, pageType, mdVersion },
    searchParams
  );
  const apiConfig = apiConfigBuilder.getConfig();

  // Fetch RMS data
  const {
    metadata,
    data,
    error,
    isLoading,
    isMetadataLoading,
    refetchData,
  } = useRMSData(apiConfig);

  // Log page view on mount
  useEffect(() => {
    logPageView('OnlineAccess', {
      companyId,
      pageType,
      mdVersion,
    });
  }, [logPageView, companyId, pageType, mdVersion]);

  // Update page title when metadata is loaded
  useEffect(() => {
    if (metadata?.title) {
      document.title = metadata.title;
    }
  }, [metadata?.title]);

  // Handle data version changes from query params
  useEffect(() => {
    if (searchParams.dataVersion) {
      refetchData(searchParams.dataVersion as string);
    }
  }, [searchParams.dataVersion, refetchData]);

  // Show loading state while fetching metadata
  if (isMetadataLoading || (!metadata && !error)) {
    return <LoadingState />;
  }

  // Show error state if there's an error
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show error if metadata is missing
  if (!metadata) {
    return (
      <ErrorState
        error={{
          code: 500,
          error: 'Unable to load page metadata',
        }}
      />
    );
  }

  return (
    <>
      {/* Dynamic Favicon */}
      {metadata.favicon && <Favicon href={metadata.favicon} />}

      {/* Loading state while data is being fetched */}
      {isLoading && !data && <LoadingState />}

      {/* Error state if data fetch failed */}
      {error && <ErrorState error={error} />}

      {/* Main content */}
      {metadata.metadata && !error && (
        <DynamicContainer
          metadata={metadata.metadata}
          dataModel={data}
          apiConfig={apiConfig}
          favicon={metadata.favicon}
          onDataUpdate={(newData) => {
            console.log('Data updated:', newData);
          }}
        />
      )}

      {/* Toast notifications */}
      <Toast />
    </>
  );
};
