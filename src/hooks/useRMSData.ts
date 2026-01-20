/**
 * Custom hook for managing RMS data fetching and state
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiConfig, MetadataResponse, DataResponse, ErrorResponse } from '@/types';
import { BackendAPIService } from '@/lib/backend-api-service';
import { isErrorResponse } from '@/lib/utils';

interface UseRMSDataReturn {
  metadata: MetadataResponse | null;
  data: DataResponse | null;
  error: ErrorResponse | null;
  isLoading: boolean;
  isMetadataLoading: boolean;
  isDataLoading: boolean;
  refetchData: (dataVersion?: string) => Promise<void>;
  refetchMetadata: () => Promise<void>;
}

export const useRMSData = (apiConfig: ApiConfig): UseRMSDataReturn => {
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [data, setData] = useState<DataResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const apiServiceRef = useRef<BackendAPIService>(new BackendAPIService(apiConfig));
  const hasFetchedRef = useRef(false);

  // Update API service when config changes
  useEffect(() => {
    apiServiceRef.current = new BackendAPIService(apiConfig);
  }, [apiConfig]);

  const fetchMetadata = useCallback(async () => {
    setIsMetadataLoading(true);
    setError(null);

    try {
      const result = await apiServiceRef.current.fetchMetadata();

      if (isErrorResponse(result)) {
        setError(result as ErrorResponse);
        setMetadata(null);
      } else {
        setMetadata(result as MetadataResponse);
        setError(null);
      }
    } catch (err) {
      console.error('Error in fetchMetadata:', err);
      setError({
        code: 500,
        error: 'An unexpected error occurred',
      });
    } finally {
      setIsMetadataLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (dataVersion?: string) => {
    setIsDataLoading(true);

    try {
      const result = await apiServiceRef.current.fetchData(dataVersion);

      if (isErrorResponse(result)) {
        setError(result as ErrorResponse);
        setData(null);
      } else {
        setData(result as DataResponse);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError({
        code: 500,
        error: 'An unexpected error occurred',
      });
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      
      const initializeFetch = async () => {
        await fetchMetadata();
        // Data will be fetched after metadata is successful
      };

      initializeFetch();
    }
  }, [fetchMetadata]);

  // Fetch data when metadata is loaded successfully
  useEffect(() => {
    if (metadata && !error && !data && !isDataLoading) {
      fetchData();
    }
  }, [metadata, error, data, isDataLoading, fetchData]);

  return {
    metadata,
    data,
    error,
    isLoading: isMetadataLoading || isDataLoading,
    isMetadataLoading,
    isDataLoading,
    refetchData: fetchData,
    refetchMetadata: fetchMetadata,
  };
};
