/**
 * API Tests for GET /api/companies endpoint
 *
 * Run tests with: npm test __tests__/api/companies-endpoint.test.ts
 */

import { GET } from "@/app/api/companies/route";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/companies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCompanies = [
    {
      id: "company-1",
      name: "Moveware Melbourne",
      brandCode: "MW-MEL",
      logoUrl: "https://example.com/logo1.png",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-15"),
      brandingSettings: {
        logoUrl: "https://example.com/logo1.png",
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        fontFamily: "Inter",
      },
      heroSettings: {
        title: "Welcome to Moveware",
        subtitle: "Professional moving",
        backgroundColor: "#2563eb",
        textColor: "#ffffff",
      },
    },
    {
      id: "company-2",
      name: "Moveware Sydney",
      brandCode: "MW-SYD",
      logoUrl: null,
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-20"),
      brandingSettings: null,
      heroSettings: null,
    },
  ];

  describe("Basic Functionality", () => {
    it("should return companies with default pagination", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(2);
      (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);

      const request = new NextRequest("http://localhost:3000/api/companies");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it("should return companies with correct schema", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(1);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[0],
      ]);

      const request = new NextRequest("http://localhost:3000/api/companies");
      const response = await GET(request);
      const data = await response.json();

      const company = data.data[0];
      expect(company).toHaveProperty("id");
      expect(company).toHaveProperty("name");
      expect(company).toHaveProperty("brandCode");
      expect(company).toHaveProperty("logoUrl");
      expect(company).toHaveProperty("primaryColor");
      expect(company).toHaveProperty("secondaryColor");
      expect(company).toHaveProperty("tertiaryColor");
      expect(company).toHaveProperty("heroContent");
      expect(company).toHaveProperty("createdAt");
      expect(company).toHaveProperty("updatedAt");
    });
  });

  describe("Pagination", () => {
    it("should handle custom page and limit parameters", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(50);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[0],
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/companies?page=2&limit=10",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(50);
      expect(data.pagination.totalPages).toBe(5);

      // Verify skip calculation
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it("should cap limit at 100", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(200);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/companies?limit=150",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(100);
    });

    it("should normalize negative page to 1", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(10);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/companies?page=-1",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
    });
  });

  describe("Search Functionality", () => {
    it("should filter companies by search term", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(1);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[0],
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/companies?search=Melbourne",
      );
      await GET(request);

      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: "Melbourne",
              mode: "insensitive",
            },
          }),
        }),
      );
    });
  });

  describe("Tenant Scoping", () => {
    it("should filter by X-Company-Id header", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(1);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[0],
      ]);

      const request = new NextRequest("http://localhost:3000/api/companies", {
        headers: {
          "X-Company-Id": "company-1",
        },
      });
      await GET(request);

      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "company-1",
          }),
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      (prisma.company.count as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
      );

      const request = new NextRequest("http://localhost:3000/api/companies");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch companies");
    });
  });

  describe("Response Transformation", () => {
    it("should handle companies with null hero settings", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(1);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[1],
      ]);

      const request = new NextRequest("http://localhost:3000/api/companies");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].heroContent).toBeNull();
    });

    it("should return tertiaryColor as null (not implemented)", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(1);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[0],
      ]);

      const request = new NextRequest("http://localhost:3000/api/companies");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].tertiaryColor).toBeNull();
    });

    it("should format timestamps as ISO 8601", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(1);
      (prisma.company.findMany as jest.Mock).mockResolvedValue([
        mockCompanies[0],
      ]);

      const request = new NextRequest("http://localhost:3000/api/companies");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(data.data[0].updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
