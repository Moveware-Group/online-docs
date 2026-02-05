/**
 * Moveware API Service
 * Handles interactions with the Moveware external API
 */

import { MovewareActivityPayload, MovewareActivityResponse, MovewareConfig } from '@/lib/types/moveware';

/**
 * Get Moveware API configuration from environment variables
 */
function getMovewareConfig(): MovewareConfig {
  const apiUrl = process.env.MOVEWARE_API_URL;
  const apiKey = process.env.MOVEWARE_API_KEY;
  const apiVersion = process.env.MOVEWARE_API_VERSION || 'v1';

  if (!apiUrl || !apiKey) {
    throw new Error('Moveware API configuration is missing. Please set MOVEWARE_API_URL and MOVEWARE_API_KEY environment variables.');
  }

  return { apiUrl, apiKey, apiVersion };
}

/**
 * Submit an acceptance activity to Moveware
 * @param jobId - The Moveware job ID
 * @param payload - Activity payload with acceptance data
 * @returns Promise with activity response
 */
export async function submitAcceptanceActivity(
  jobId: string,
  payload: MovewareActivityPayload
): Promise<MovewareActivityResponse> {
  const config = getMovewareConfig();
  const endpoint = `${config.apiUrl}/api/jobs/${jobId}/activities`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Version': config.apiVersion,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      throw new Error(
        errorData.error || errorData.message || `Failed to submit activity: ${response.statusText}`
      );
    }

    const data: MovewareActivityResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting activity to Moveware:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred while submitting the activity');
  }
}

/**
 * Validate that Moveware API is configured
 * @returns boolean indicating if API is configured
 */
export function isMovewareConfigured(): boolean {
  try {
    getMovewareConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test Moveware API connectivity
 * @returns Promise with connection test result
 */
export async function testMovewareConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const config = getMovewareConfig();
    const endpoint = `${config.apiUrl}/api/health`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Version': config.apiVersion,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to Moveware API',
      };
    }

    return {
      success: false,
      message: `Connection failed: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}
