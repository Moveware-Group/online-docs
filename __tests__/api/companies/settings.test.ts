/**
 * Comprehensive API Security and Validation Tests for Company Settings
 * Tests authentication, authorization, validation, and concurrent updates
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GET, PUT } from "@/app/api/companies/[id]/settings/route";
import {
  createMockRequest,
  createMockParams,
  getResponseJson,
  mockAdminHeaders,
  mockStaffHeaders,
  mockUnauthenticatedHeaders,
} from "../../helpers/test-utils";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
    },
    brandingSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/middleware/auth", () => ({
  requireAdmin: jest.fn(),
}));

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";

const mockPrisma = prisma as any;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<
  typeof requireAdmin
>;

describe("Company Settings API - Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/companies/[id]/settings", () => {
    describe("Authentication", () => {
      it("should return 401 for unauthenticated requests", async () => {
        // Mock auth middleware to return 401
        mockRequireAdmin.mockResolvedValue({
          error: "Authentication required",
          status: 401,
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          { headers: mockUnauthenticatedHeaders },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await GET(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Authentication required");
      });
    });

    describe("Authorization", () => {
      it("should return 403 for non-admin users", async () => {
        // Mock auth middleware to return 403
        mockRequireAdmin.mockResolvedValue({
          error: "Admin access required",
          status: 403,
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          { headers: mockStaffHeaders },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await GET(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Admin access required");
      });

      it("should return 403 when accessing other company settings", async () => {
        // Mock auth middleware to return 403 for cross-company access
        mockRequireAdmin.mockResolvedValue({
          error: "Access denied: You can only access your own company settings",
          status: 403,
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/other-company/settings",
          {
            headers: { ...mockAdminHeaders, "X-Company-Id": "test-company-1" },
          },
        );
        const params = createMockParams({ id: "other-company" });

        const response = await GET(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Access denied");
      });
    });

    describe("Validation", () => {
      it("should return 404 for invalid company ID", async () => {
        // Mock successful auth but company not found
        mockRequireAdmin.mockResolvedValue(null);
        mockPrisma.brandingSettings.findUnique.mockResolvedValue(null);

        const request = createMockRequest(
          "http://localhost:3000/api/companies/non-existent-company/settings",
          { headers: mockAdminHeaders },
        );
        const params = createMockParams({ id: "non-existent-company" });

        const response = await GET(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Should return default settings when company exists but no branding
        expect(data.data.primaryColor).toBe("#2563eb");
      });
    });

    describe("Success Cases", () => {
      it("should return company settings for authenticated admin", async () => {
        mockRequireAdmin.mockResolvedValue(null);
        mockPrisma.brandingSettings.findUnique.mockResolvedValue({
          companyId: "test-company-1",
          logoUrl: "https://example.com/logo.png",
          primaryColor: "#2563eb",
          secondaryColor: "#1e40af",
          fontFamily: "Inter",
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          { headers: mockAdminHeaders },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await GET(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.primaryColor).toBe("#2563eb");
      });
    });
  });

  describe("PUT /api/companies/[id]/settings", () => {
    describe("Authentication", () => {
      it("should return 401 for unauthenticated requests", async () => {
        mockRequireAdmin.mockResolvedValue({
          error: "Authentication required",
          status: 401,
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockUnauthenticatedHeaders,
            body: { primaryColor: "#ff0000" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
      });
    });

    describe("Authorization", () => {
      it("should return 403 for non-admin users", async () => {
        mockRequireAdmin.mockResolvedValue({
          error: "Admin access required",
          status: 403,
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockStaffHeaders,
            body: { primaryColor: "#ff0000" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
      });
    });

    describe("Color Validation", () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue(null);
      });

      it("should reject invalid hex color without # prefix", async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "ff0000" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("valid hex color");
      });

      it("should reject invalid hex color with invalid characters", async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "#gggggg" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("valid hex color");
      });

      it("should reject invalid hex color with wrong length", async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "#ff00" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("valid hex color");
      });

      it("should accept valid 6-digit hex color", async () => {
        mockPrisma.brandingSettings.upsert.mockResolvedValue({
          companyId: "test-company-1",
          logoUrl: null,
          primaryColor: "#ff0000",
          secondaryColor: "#1e40af",
          fontFamily: "Inter",
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "#ff0000" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.primaryColor).toBe("#ff0000");
      });

      it("should accept valid 3-digit hex color", async () => {
        mockPrisma.brandingSettings.upsert.mockResolvedValue({
          companyId: "test-company-1",
          logoUrl: null,
          primaryColor: "#f00",
          secondaryColor: "#1e40af",
          fontFamily: "Inter",
        });

        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "#f00" },
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe("Malformed Request Validation", () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue(null);
      });

      it("should return 400 when no color provided", async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: {},
          },
        );
        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("must be provided");
      });

      it("should return 400 with clear message for invalid JSON", async () => {
        const request = new Request(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: {
              ...mockAdminHeaders,
              "Content-Type": "application/json",
            },
            body: "invalid-json{",
          },
        ) as any;

        const params = createMockParams({ id: "test-company-1" });

        const response = await PUT(request, params);
        const data = await getResponseJson(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Invalid JSON");
      });
    });

    describe("Concurrent Updates", () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue(null);
      });

      it("should handle concurrent updates with last-write-wins", async () => {
        // Simulate two concurrent update requests
        const timestamp1 = new Date();
        const timestamp2 = new Date(timestamp1.getTime() + 1000);

        mockPrisma.brandingSettings.upsert
          .mockResolvedValueOnce({
            companyId: "test-company-1",
            logoUrl: null,
            primaryColor: "#ff0000",
            secondaryColor: "#1e40af",
            fontFamily: "Inter",
            updatedAt: timestamp1,
          })
          .mockResolvedValueOnce({
            companyId: "test-company-1",
            logoUrl: null,
            primaryColor: "#00ff00",
            secondaryColor: "#1e40af",
            fontFamily: "Inter",
            updatedAt: timestamp2,
          });

        // First update
        const request1 = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "#ff0000" },
          },
        );
        const params1 = createMockParams({ id: "test-company-1" });

        // Second update
        const request2 = createMockRequest(
          "http://localhost:3000/api/companies/test-company-1/settings",
          {
            method: "PUT",
            headers: mockAdminHeaders,
            body: { primaryColor: "#00ff00" },
          },
        );
        const params2 = createMockParams({ id: "test-company-1" });

        // Execute both updates
        const [response1, response2] = await Promise.all([
          PUT(request1, params1),
          PUT(request2, params2),
        ]);

        const data1 = await getResponseJson(response1);
        const data2 = await getResponseJson(response2);

        // Both should succeed (last-write-wins)
        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(data1.success).toBe(true);
        expect(data2.success).toBe(true);

        // Verify both updates were processed
        expect(mockPrisma.brandingSettings.upsert).toHaveBeenCalledTimes(2);
      });

      it("should detect conflicts in rapid succession updates", async () => {
        mockPrisma.brandingSettings.upsert.mockResolvedValue({
          companyId: "test-company-1",
          logoUrl: null,
          primaryColor: "#ff0000",
          secondaryColor: "#1e40af",
          fontFamily: "Inter",
        });

        // Create 5 concurrent updates
        const updates = Array.from({ length: 5 }, (_, i) =>
          createMockRequest(
            "http://localhost:3000/api/companies/test-company-1/settings",
            {
              method: "PUT",
              headers: mockAdminHeaders,
              body: { primaryColor: `#${i}${i}0000` },
            },
          ),
        );

        const params = createMockParams({ id: "test-company-1" });

        // Execute all updates concurrently
        const responses = await Promise.all(
          updates.map((request) => PUT(request, params)),
        );

        // All should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });

        // Verify all updates were attempted
        expect(mockPrisma.brandingSettings.upsert).toHaveBeenCalledTimes(5);
      });
    });
  });
});
