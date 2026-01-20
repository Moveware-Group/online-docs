/**
 * Dynamic Container Component
 * Wrapper for the MoveConnect SDK dynamic container
 * This component integrates with the @moveconnect/sdk library
 */

'use client';

import { useCallback, useState } from 'react';
import type { ApiConfig, ActionData, OnClickEvent } from '@/types';
import { BackendAPIService } from '@/lib/backend-api-service';
import { getValueFromObjectWithString, isPopupBlocked } from '@/lib/utils';
import { useMonitoring } from '@/hooks/useMonitoring';

interface DynamicContainerProps {
  metadata: any;
  dataModel: any;
  apiConfig: ApiConfig;
  favicon?: string;
  onDataUpdate?: (data: any) => void;
}

export const DynamicContainer = ({
  metadata,
  dataModel,
  apiConfig,
  favicon,
  onDataUpdate,
}: DynamicContainerProps) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState<any>(null);
  const { logFormSubmit, logException } = useMonitoring();

  const processResponsesAndFindErrors = useCallback(
    (actions: OnClickEvent[] | undefined, responses: any[]): boolean => {
      const responsePaths = actions?.find((el) => el.responsePaths)?.responsePaths;

      for (const response of responses) {
        if (!response) {
          setIsDisabled(false);
          setError({ code: 500, error: 'No response received' });
          return true;
        }

        // Check if it's an error response
        if (response.status === 0 || (response.status && (response.status < 200 || response.status >= 300))) {
          setIsDisabled(false);
          setError({
            code: response.status || 500,
            error: response.error || 'Request failed',
          });
          return true;
        }

        const status = responsePaths?.status && getValueFromObjectWithString(responsePaths.status, response.body);
        
        if (status && (status < 200 || status >= 300)) {
          setIsDisabled(false);
          setError({
            code: status,
            error: responsePaths?.error && getValueFromObjectWithString(responsePaths.error, response.body),
          });
          return true;
        }

        // Move actions up a level if needed
        if (actions) {
          moveActionsLevelUp(actions, responsePaths, response.body);
        }
      }

      return false;
    },
    []
  );

  const moveActionsLevelUp = (
    actions: OnClickEvent[],
    responsePaths: OnClickEvent['responsePaths'],
    body: object
  ): void => {
    // Handle deprecated redirectUrl
    if (responsePaths?.redirectUrl) {
      const value = getValueFromObjectWithString(responsePaths.redirectUrl, body);
      value && actions.push({ redirectURL: value });
    }
    
    if (responsePaths?.redirectURL) {
      const value = getValueFromObjectWithString(responsePaths.redirectURL, body);
      value && actions.push({ redirectURL: value });
    }
    
    if (responsePaths?.navigateURL) {
      const value = getValueFromObjectWithString(responsePaths.navigateURL, body);
      value && actions.push({ navigateURL: value });
    }
    
    if (responsePaths?.tagRefresh) {
      actions.push({ tagRefresh: responsePaths.tagRefresh });
    }
    
    if (responsePaths?.downloadSrc) {
      const value = getValueFromObjectWithString(responsePaths.downloadSrc, body);
      value && actions.push({ downloadSrc: value });
    }
  };

  const handleActionEvent = useCallback(
    async (actionData: ActionData) => {
      // Log form submission
      logFormSubmit(actionData.formData, apiConfig.dataQueryParams.token);

      setIsDisabled(true);
      setError(null);

      try {
        const apiService = new BackendAPIService(apiConfig);
        const responses = await apiService.postData(actionData);

        if (processResponsesAndFindErrors(actionData.actions, responses)) {
          return;
        }

        // Check if we should keep page disabled during redirect
        if (!actionData.callback || !actionData.actions?.some((el) => el.redirectURL)) {
          setIsDisabled(false);
        }

        if (actionData.callback) {
          // Sort actions so redirects/navigates come last
          actionData.actions?.sort((a, b) => {
            if (!(a.hasOwnProperty('redirectURL') || a.hasOwnProperty('navigateURL'))) return -1;
            if (!(b.hasOwnProperty('redirectURL') || b.hasOwnProperty('navigateURL'))) return 1;
            return 0;
          });

          const hasNavigateURL =
            actionData.actions &&
            (actionData.actions[actionData.actions.length - 1].hasOwnProperty('navigateURL') ||
              actionData.actions[actionData.actions.length - 1].responsePaths?.hasOwnProperty('navigateURL'));

          if (hasNavigateURL && isPopupBlocked()) {
            actionData.callback(actionData.actions, actionData.setButtonCallback);
          } else {
            actionData.callback(actionData.actions);
          }
        }

        // Notify parent of data update if callback provided
        if (onDataUpdate) {
          onDataUpdate(responses);
        }
      } catch (err) {
        console.error('Error handling action event:', err);
        logException(err);
        setIsDisabled(false);
        setError({
          code: 500,
          error: 'An unexpected error occurred',
        });
      }
    },
    [apiConfig, logFormSubmit, logException, onDataUpdate, processResponsesAndFindErrors]
  );

  // This is a placeholder component
  // In a real implementation, you would use the actual @moveconnect/sdk DynamicContainer
  // For now, we'll render a simple representation
  
  return (
    <div className="dynamic-container-wrapper">
      {/* 
        Real implementation would be:
        <LibDynamicContainer
          metadata={metadata}
          dataModel={dataModel}
          apiConfig={apiConfig}
          favicon={favicon}
          onActionEvent={handleActionEvent}
        />
      */}
      
      <div className="placeholder-notice">
        <p>
          <strong>Note:</strong> This is a placeholder for the MoveConnect SDK DynamicContainer.
        </p>
        <p>
          To use the actual component, uncomment the LibDynamicContainer import and usage above,
          and ensure @moveconnect/sdk is properly configured.
        </p>
      </div>

      {error && (
        <div className="error-notification">
          <p>Error: {error.error}</p>
          <p>Code: {error.code}</p>
        </div>
      )}

      {isDisabled && (
        <div className="overlay-container">
          <div className="overlay flex-col flex-items-center flex-content-center">
            <div className="loader2" />
          </div>
        </div>
      )}
    </div>
  );
};
