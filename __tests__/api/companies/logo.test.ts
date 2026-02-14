/**
 * Comprehensive File Upload Security Tests for Company Logo
 * Tests file size limits, MIME type validation, SVG rejection
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GET, POST, DELETE } from "@/app/api/companies/[id]/logo/route";
import {
  createMockRequest,
  createMockParams,
  getResponseJson,
  createMockFile,
  createLargeFile,
  createFormDataWithFile,
  mockAdminHeaders,
} from "../../helpers/test-utils";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/azureStorage", () => ({
  azureStorageService: {
    isConfigured: jest.fn(),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    extractBlobNameFromUrl: jest.fn(),
  },
}));

import { prisma } from "@/lib/db";
import { azureStorageService } from "@/lib/services/azureStorage";

const mockPrisma = prisma as any;
const mockAzureStorage = azureStorageService as any;

describe("Company Logo API - File Upload Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAzureStorage.isConfigured.mockResolvedValue(true);
  });

  describe("GET /api/companies/[id]/logo", () => {
    it("should return 404 for non-existent company", async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      const request = createMockRequest(
        "http://localhost:3000/api/companies/non-existent/logo",
      );
      const params = createMockParams({ id: "non-existent" });

      const response = await GET(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });

    it("should return company logo URL for valid company", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: "https://example.com/logo.png",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await GET(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.logoUrl).toBe("https://example.com/logo.png");
    });
  });

  describe("POST /api/companies/[id]/logo - File Size Validation", () => {
    it("should reject files larger than 2MB", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });

      // Create a 3MB file
      const largeFile = createLargeFile(3);
      const formData = createFormDataWithFile(largeFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: false,
        error: "File size exceeds 2MB limit",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("exceeds 2MB");
    });

    it("should accept files under 2MB", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });

      // Create a small file (1MB)
      const validFile = createMockFile(
        "a".repeat(1024 * 1024),
        "logo.png",
        "image/png",
      );
      const formData = createFormDataWithFile(validFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: true,
        url: "https://example.com/logo.png",
      });

      mockPrisma.company.update.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: "https://example.com/logo.png",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logo uploaded successfully");
    });
  });

  describe("POST /api/companies/[id]/logo - MIME Type Validation", () => {
    beforeEach(() => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });
    });

    it("should reject non-image files", async () => {
      const pdfFile = createMockFile(
        "PDF content",
        "document.pdf",
        "application/pdf",
      );
      const formData = createFormDataWithFile(pdfFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: false,
        error: "Invalid file type. Only PNG, JPEG, and WebP images are allowed",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid file type");
    });

    it("should accept PNG images", async () => {
      const pngFile = createMockFile("PNG content", "logo.png", "image/png");
      const formData = createFormDataWithFile(pngFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: true,
        url: "https://example.com/logo.png",
      });

      mockPrisma.company.update.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: "https://example.com/logo.png",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logo uploaded successfully");
    });

    it("should accept JPEG images", async () => {
      const jpegFile = createMockFile("JPEG content", "logo.jpg", "image/jpeg");
      const formData = createFormDataWithFile(jpegFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: true,
        url: "https://example.com/logo.jpg",
      });

      mockPrisma.company.update.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: "https://example.com/logo.jpg",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logo uploaded successfully");
    });

    it("should accept WebP images", async () => {
      const webpFile = createMockFile(
        "WebP content",
        "logo.webp",
        "image/webp",
      );
      const formData = createFormDataWithFile(webpFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: true,
        url: "https://example.com/logo.webp",
      });

      mockPrisma.company.update.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: "https://example.com/logo.webp",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logo uploaded successfully");
    });
  });

  describe("POST /api/companies/[id]/logo - SVG Rejection", () => {
    beforeEach(() => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });
    });

    it("should reject SVG files", async () => {
      const svgFile = createMockFile(
        '<svg xmlns="http://www.w3.org/2000/svg"><circle r="50"/></svg>',
        "logo.svg",
        "image/svg+xml",
      );
      const formData = createFormDataWithFile(svgFile);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: false,
        error: "SVG files are not allowed for security reasons",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("SVG files are not allowed");
    });

    it("should reject files with .svg extension even if MIME type is spoofed", async () => {
      const fakePng = createMockFile(
        '<svg xmlns="http://www.w3.org/2000/svg"><circle r="50"/></svg>',
        "logo.svg",
        "image/png", // Spoofed MIME type
      );
      const formData = createFormDataWithFile(fakePng);

      mockAzureStorage.uploadFile.mockResolvedValue({
        success: false,
        error: "File appears to be SVG based on content analysis",
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain("SVG");
    });
  });

  describe("POST /api/companies/[id]/logo - Malformed Requests", () => {
    beforeEach(() => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });
    });

    it("should return 400 when no file is provided", async () => {
      const formData = new FormData();

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("No file provided. Please upload a logo image.");
    });

    it("should return 404 for non-existent company", async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      const validFile = createMockFile("content", "logo.png", "image/png");
      const formData = createFormDataWithFile(validFile);

      const request = createMockRequest(
        "http://localhost:3000/api/companies/non-existent/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "non-existent" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Company not found");
    });

    it("should return 503 when storage is not configured", async () => {
      mockAzureStorage.isConfigured.mockResolvedValue(false);

      const validFile = createMockFile("content", "logo.png", "image/png");
      const formData = createFormDataWithFile(validFile);

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        {
          method: "POST",
          headers: mockAdminHeaders,
          formData,
        },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await POST(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(503);
      expect(data.error).toContain("not configured");
    });
  });

  describe("DELETE /api/companies/[id]/logo", () => {
    it("should return 404 for company without logo", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        { method: "DELETE", headers: mockAdminHeaders },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await DELETE(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("No logo to delete");
    });

    it("should successfully delete existing logo", async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: "https://example.com/logos/test-company-1/logo.png",
      });

      mockAzureStorage.extractBlobNameFromUrl.mockReturnValue(
        "logos/test-company-1/logo.png",
      );
      mockAzureStorage.deleteFile.mockResolvedValue({ success: true });
      mockPrisma.company.update.mockResolvedValue({
        id: "test-company-1",
        name: "Test Company",
        logoUrl: null,
      });

      const request = createMockRequest(
        "http://localhost:3000/api/companies/test-company-1/logo",
        { method: "DELETE", headers: mockAdminHeaders },
      );
      const params = createMockParams({ id: "test-company-1" });

      const response = await DELETE(request, params);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logo deleted successfully");
    });
  });
});
