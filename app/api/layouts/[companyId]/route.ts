/**
 * Custom Layout CRUD API
 * GET    /api/layouts/[companyId] - Fetch layout for a company
 * PUT    /api/layouts/[companyId] - Create or update layout for a company
 * DELETE /api/layouts/[companyId] - Delete layout for a company
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isGraceCompany(company: { tenantId?: string | null; brandCode?: string | null; name?: string | null } | null): boolean {
  if (!company) return false;
  const tenantId = (company.tenantId || "").toLowerCase();
  const brandCode = (company.brandCode || "").toLowerCase();
  const name = (company.name || "").toLowerCase();
  return (
    tenantId === "55580" ||
    tenantId === "67200" ||
    brandCode.includes("grace") ||
    name.includes("grace")
  );
}

function buildGraceStaticLayoutConfig() {
  return {
    version: 1,
    globalStyles: {
      fontFamily: "Arial, Helvetica, sans-serif",
      backgroundColor: "#ededed",
      maxWidth: "980px",
    },
    sections: [
      {
        id: "document",
        type: "custom_html",
        visible: true,
        html: `
<div style="background:#ededed;padding:12px 0;">
  <div style="background:#ffffff;border:1px solid #e5e7eb;">
    <div style="background:#cc0000;color:#fff;padding:14px 16px;display:flex;align-items:flex-start;justify-content:space-between;">
      <div style="font-size:52px;font-weight:700;line-height:0.9;opacity:0.35;">grace:</div>
      <div style="text-align:right;">
        <div style="font-size:30px;font-weight:700;line-height:1.1;">Moving Quote</div>
        <div style="font-size:16px;font-weight:700;">{{quoteDate}}</div>
      </div>
    </div>
    <div style="height:84px;background:#f7f7f7;border-bottom:1px solid #ededed;display:flex;align-items:center;justify-content:center;gap:40px;color:#6b7280;font-size:14px;">
      <div style="padding:8px 14px;background:#ffffff;border:1px solid #d9d9d9;">Mascot Banner Area</div>
      <div style="padding:8px 14px;background:#ffffff;border:1px solid #d9d9d9;">Upload header image for exact artwork</div>
    </div>

    <div style="margin:16px;border:1px solid #e5e7eb;background:#fff;padding:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div style="font-size:34px;font-weight:700;color:rgba(204,0,0,0.18);line-height:1;">grace:</div>
        <div style="width:100%;">
          <div style="font-size:30px;margin-bottom:10px;color:#222;">Thank you for choosing Grace</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;font-size:20px;color:#222;">
            <div><strong>Prepared for:</strong> {{customerName}}</div>
            <div><strong>Quote ref#:</strong> {{job.id}}</div>
            <div><strong>Quote author:</strong> Consultant</div>
            <div><strong>Survey consultant:</strong> Consultant</div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin:16px 16px 8px;color:#cc0000;font-size:24px;border-bottom:2px solid #cc0000;padding-bottom:4px;">Moving Locations</div>
    <div style="margin:0 16px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;color:#222;font-size:22px;">
      <div>
        <div style="font-weight:700;">Packing From</div>
        <div>{{job.upliftLine1}}</div>
        <div>{{job.upliftCity}}, {{job.upliftState}} {{job.upliftPostcode}}</div>
      </div>
      <div>
        <div style="font-weight:700;">From info</div>
        <div>{{job.upliftCountry}}</div>
      </div>
      <div>
        <div style="font-weight:700;">Moving to/na</div>
        <div>{{job.deliveryLine1}}</div>
        <div>{{job.deliveryCity}}, {{job.deliveryState}} {{job.deliveryPostcode}}</div>
      </div>
    </div>

    <div style="margin:0 16px 16px;padding:16px;background:#f7f7f7;">
      <div style="font-size:30px;font-style:italic;color:#333;margin-bottom:8px;">GraceCover</div>
      <div style="font-size:20px;color:#444;line-height:1.4;">
        This quotation includes insurance and service details. Final policy terms and conditions apply.
      </div>
    </div>

    <div style="margin:0 16px 0;background:#cc0000;color:#fff;font-size:22px;font-weight:700;padding:8px 12px;">Option 1 - Choose For</div>
    <table style="margin:0 16px 16px;width:calc(100% - 32px);border-collapse:collapse;font-size:18px;background:#fff;">
      <thead>
        <tr style="background:#f3f4f6;border-bottom:1px solid #d1d5db;">
          <th style="text-align:left;padding:8px;">Description</th>
          <th style="text-align:right;padding:8px;">Quantity</th>
          <th style="text-align:right;padding:8px;">Rate</th>
          <th style="text-align:right;padding:8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each costings}}
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;">{{this.name}} - {{this.description}}</td>
          <td style="padding:8px;text-align:right;">{{this.quantity}}</td>
          <td style="padding:8px;text-align:right;">{{this.rate}}</td>
          <td style="padding:8px;text-align:right;">{{this.totalPrice}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div style="margin:0 16px 0;background:#cc0000;color:#fff;font-size:22px;font-weight:700;padding:8px 12px;">Option 2 - Packing/Unpacking Extras</div>
    <table style="margin:0 16px 16px;width:calc(100% - 32px);border-collapse:collapse;font-size:18px;background:#fff;">
      <thead>
        <tr style="background:#f3f4f6;border-bottom:1px solid #d1d5db;">
          <th style="text-align:left;padding:8px;">Description</th>
          <th style="text-align:right;padding:8px;">Quantity</th>
          <th style="text-align:right;padding:8px;">Rate</th>
          <th style="text-align:right;padding:8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each costings}}
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;">{{this.name}} - {{this.description}}</td>
          <td style="padding:8px;text-align:right;">{{this.quantity}}</td>
          <td style="padding:8px;text-align:right;">{{this.rate}}</td>
          <td style="padding:8px;text-align:right;">{{this.totalPrice}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div style="margin:0 16px 12px;color:#cc0000;font-size:30px;">Accept quote</div>
    <div style="margin:0 16px 16px;padding:16px;background:#fff;border:1px solid #e5e7eb;">
      <div style="font-size:16px;color:#444;margin-bottom:8px;">For acceptance workflow, please use the standard quote acceptance controls below this preview flow.</div>
      <div style="height:60px;border-bottom:1px solid #9ca3af;width:260px;margin-top:20px;"></div>
      <div style="font-size:14px;color:#6b7280;margin-top:4px;">Signature</div>
    </div>

    <div style="margin:0 16px 0;color:#cc0000;font-size:24px;font-weight:700;">Included items</div>
    <table style="margin:8px 16px 20px;width:calc(100% - 32px);border-collapse:collapse;font-size:16px;background:#fff;">
      <thead>
        <tr style="background:#f3f4f6;border-bottom:1px solid #d1d5db;">
          <th style="text-align:left;padding:8px;">Description</th>
          <th style="text-align:left;padding:8px;">Room</th>
          <th style="text-align:right;padding:8px;">Qty</th>
          <th style="text-align:right;padding:8px;">Cube</th>
        </tr>
      </thead>
      <tbody>
        {{#each inventory}}
        <tr style="border-bottom:1px solid #ececec;">
          <td style="padding:8px;">{{this.description}}</td>
          <td style="padding:8px;">{{this.room}}</td>
          <td style="padding:8px;text-align:right;">{{this.quantity}}</td>
          <td style="padding:8px;text-align:right;">{{this.cube}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
</div>`,
      },
    ],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;
    let resolvedCompany: {
      id: string;
      name: string;
      brandCode: string;
      tenantId: string;
    } | null = null;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Try to find layout by internal company ID first, then by tenant ID (coId from URL)
    let layout = await prisma.customLayout.findUnique({
      where: { companyId },
      include: {
        company: {
          select: { id: true, name: true, brandCode: true, tenantId: true },
        },
      },
    });
    if (layout?.company) {
      resolvedCompany = layout.company;
    }

    // If not found by internal ID, try looking up by tenant ID (e.g. coId=12 from the quote page URL)
    if (!layout) {
      const company = await prisma.company.findFirst({
        where: {
          OR: [{ id: companyId }, { tenantId: companyId }],
        },
        select: {
          id: true,
          name: true,
          brandCode: true,
          tenantId: true,
        },
      });
      resolvedCompany = company;
      if (company) {
        layout = await prisma.customLayout.findUnique({
          where: { companyId: company.id },
          include: {
            company: {
              select: { id: true, name: true, brandCode: true, tenantId: true },
            },
          },
        });
        if (layout?.company) {
          resolvedCompany = layout.company;
        }
      }
    }

    if (!layout) {
      // Temporary static fallback for Grace company while AI layout builder is being stabilised.
      if (isGraceCompany(resolvedCompany)) {
        return NextResponse.json({
          success: true,
          data: {
            id: `static-grace-${resolvedCompany?.id || companyId}`,
            companyId: resolvedCompany?.id || companyId,
            layoutConfig: buildGraceStaticLayoutConfig(),
            version: 1,
            isActive: true,
            source: "static_fallback",
          },
        });
      }
      return NextResponse.json(
        { success: false, error: "No custom layout found for this company" },
        { status: 404 },
      );
    }

    // Parse the JSON config
    let layoutConfig;
    try {
      layoutConfig = JSON.parse(layout.layoutConfig);
    } catch {
      layoutConfig = layout.layoutConfig;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...layout,
        layoutConfig,
      },
    });
  } catch (error) {
    console.error("Error fetching custom layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch custom layout" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    const {
      layoutConfig,
      referenceUrl,
      referenceFile,
      description,
      isActive,
      conversationId,
      createdBy,
    } = body;

    if (!layoutConfig) {
      return NextResponse.json(
        { success: false, error: "layoutConfig is required" },
        { status: 400 },
      );
    }

    // Verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // Stringify config if it's an object
    const configString =
      typeof layoutConfig === "string"
        ? layoutConfig
        : JSON.stringify(layoutConfig);

    // Upsert the layout
    const layout = await prisma.customLayout.upsert({
      where: { companyId },
      update: {
        layoutConfig: configString,
        referenceUrl: referenceUrl || undefined,
        referenceFile: referenceFile || undefined,
        description: description || undefined,
        isActive: isActive !== undefined ? isActive : true,
        conversationId: conversationId || undefined,
        createdBy: createdBy || undefined,
        version: { increment: 1 },
      },
      create: {
        companyId,
        layoutConfig: configString,
        referenceUrl: referenceUrl || null,
        referenceFile: referenceFile || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        conversationId: conversationId || null,
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...layout,
        layoutConfig: JSON.parse(layout.layoutConfig),
      },
    });
  } catch (error) {
    console.error("Error saving custom layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save custom layout" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.customLayout.findUnique({
      where: { companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "No custom layout found for this company" },
        { status: 404 },
      );
    }

    await prisma.customLayout.delete({ where: { companyId } });

    return NextResponse.json({
      success: true,
      message: "Custom layout deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete custom layout" },
      { status: 500 },
    );
  }
}
