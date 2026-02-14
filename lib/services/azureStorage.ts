/**
 * Azure Blob Storage Service
 *
 * Handles file uploads to Azure Blob Storage with comprehensive validation:
 * - File size limits (2MB max)
 * - MIME type validation (PNG, JPEG, WebP only - no SVG due to XSS risk)
 * - MIME sniffing to prevent type spoofing
 * - Unique filename generation (UUID)
 * - Container existence verification
 */

import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "crypto";

// Allowed MIME types for logo uploads (SVG blocked due to XSS risk)
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

// File extensions mapping
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// Maximum file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Validation result for file uploads
 */
interface FileValidation {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
}

/**
 * Upload result
 */
interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  blobName?: string;
}

/**
 * Delete result
 */
interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Azure Blob Storage Service Class
 */
class AzureStorageService {
  private containerClient: ContainerClient | null = null;
  private initialized = false;

  /**
   * Initialize the Azure Blob Storage client
   */
  private async initialize(): Promise<void> {
    if (this.initialized && this.containerClient) {
      return;
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || "company-logos";

    if (!connectionString) {
      throw new Error(
        "Azure Storage connection string not configured. Please set AZURE_STORAGE_CONNECTION_STRING environment variable.",
      );
    }

    try {
      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient =
        blobServiceClient.getContainerClient(containerName);

      // Verify container exists, create if it doesn't
      const exists = await this.containerClient.exists();
      if (!exists) {
        console.log(`Container '${containerName}' does not exist. Creating...`);
        await this.containerClient.create({
          access: "blob", // Public read access for logo URLs
        });
        console.log(`Container '${containerName}' created successfully.`);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Azure Storage:", error);
      throw new Error(
        "Failed to connect to Azure Blob Storage. Please check your connection string.",
      );
    }
  }

  /**
   * Validate file before upload
   * - Checks file size (max 2MB)
   * - Validates MIME type using actual file content (MIME sniffing)
   * - Blocks SVG files due to XSS risk
   */
  private async validateFile(
    buffer: Buffer,
    contentType?: string,
  ): Promise<FileValidation> {
    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Use MIME sniffing to detect actual file type from buffer
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        valid: false,
        error:
          "Unable to determine file type. Please upload a valid image file.",
      };
    }

    // Verify detected MIME type is allowed
    if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return {
        valid: false,
        error: `File type '${fileType.mime}' is not allowed. Only PNG, JPEG, and WebP images are permitted. SVG files are blocked due to security risks.`,
        detectedMimeType: fileType.mime,
      };
    }

    // Additional check: if content-type header was provided, warn if it doesn't match
    if (contentType && contentType !== fileType.mime) {
      console.warn(
        `Content-Type header (${contentType}) does not match detected MIME type (${fileType.mime}). Using detected type.`,
      );
    }

    return {
      valid: true,
      detectedMimeType: fileType.mime,
    };
  }

  /**
   * Generate a unique filename with UUID
   */
  private generateUniqueFilename(mimeType: string, companyId: string): string {
    const extension = MIME_TO_EXTENSION[mimeType] || "jpg";
    const uuid = randomUUID();
    return `${companyId}/${uuid}.${extension}`;
  }

  /**
   * Upload a file to Azure Blob Storage
   * @param buffer File buffer
   * @param companyId Company ID for organizing files
   * @param contentType Content-Type header (optional, will be validated against actual file)
   * @returns Upload result with public URL or error message
   */
  async uploadFile(
    buffer: Buffer,
    companyId: string,
    contentType?: string,
  ): Promise<UploadResult> {
    try {
      // Initialize Azure Storage client
      await this.initialize();

      if (!this.containerClient) {
        return {
          success: false,
          error: "Azure Storage not initialized",
        };
      }

      // Validate file
      const validation = await this.validateFile(buffer, contentType);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate unique filename
      const blobName = this.generateUniqueFilename(
        validation.detectedMimeType!,
        companyId,
      );
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload to Azure Blob Storage
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: validation.detectedMimeType,
          blobCacheControl: "public, max-age=31536000", // Cache for 1 year
        },
      });

      // Return public URL
      const url = blockBlobClient.url;

      return {
        success: true,
        url,
        blobName,
      };
    } catch (error) {
      console.error("Azure Storage upload failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload file to Azure Storage",
      };
    }
  }

  /**
   * Delete a file from Azure Blob Storage
   * @param blobName Blob name (path) in storage
   * @returns Delete result
   */
  async deleteFile(blobName: string): Promise<DeleteResult> {
    try {
      // Initialize Azure Storage client
      await this.initialize();

      if (!this.containerClient) {
        return {
          success: false,
          error: "Azure Storage not initialized",
        };
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Check if blob exists before attempting to delete
      const exists = await blockBlobClient.exists();
      if (!exists) {
        return {
          success: false,
          error: "File not found in storage",
        };
      }

      // Delete the blob
      await blockBlobClient.delete();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Azure Storage delete failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete file from Azure Storage",
      };
    }
  }

  /**
   * Extract blob name from Azure Blob Storage URL
   * @param url Full Azure Blob Storage URL
   * @returns Blob name (path) or null if invalid URL
   */
  extractBlobNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Extract path after container name
      // URL format: https://{account}.blob.core.windows.net/{container}/{blobName}
      const pathParts = urlObj.pathname.split("/").filter((p) => p);
      if (pathParts.length >= 2) {
        // Remove container name, keep blob path
        return pathParts.slice(1).join("/");
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if Azure Storage is configured and accessible
   * @returns True if configured and accessible, false otherwise
   */
  async isConfigured(): Promise<boolean> {
    try {
      await this.initialize();
      return this.initialized && this.containerClient !== null;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const azureStorageService = new AzureStorageService();

// Export types
export type { UploadResult, DeleteResult, FileValidation };
