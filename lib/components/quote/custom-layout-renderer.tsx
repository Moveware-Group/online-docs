'use client';

import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import {
  HeaderSection,
  IntroSection,
  LocationInfo,
  EstimateCard,
  InventoryTable,
  TermsSection,
} from './sections';
import type { QuotePageData, CostingItem } from './sections/types';
import type { LayoutConfig, LayoutSection } from '@/lib/services/llm-service';

// ---------------------------------------------------------------------------
// Template variable resolver
// ---------------------------------------------------------------------------

/**
 * Simple Handlebars-like template resolver.
 * Supports: {{variable}}, {{#each array}} ... {{/each}}
 */
function resolveTemplate(
  html: string,
  data: QuotePageData,
): string {
  let result = html;

  // Resolve {{#each inventory}} ... {{/each}}
  result = result.replace(
    /\{\{#each\s+inventory\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, itemTemplate: string) => {
      return data.inventory
        .map((item) => {
          let row = itemTemplate;
          row = row.replace(/\{\{this\.description\}\}/g, item.description || '');
          row = row.replace(/\{\{this\.room\}\}/g, item.room || '');
          row = row.replace(/\{\{this\.quantity\}\}/g, String(item.quantity || 1));
          row = row.replace(/\{\{this\.cube\}\}/g, (item.cube || 0).toFixed(2));
          row = row.replace(/\{\{this\.typeCode\}\}/g, item.typeCode || 'N/A');
          return row;
        })
        .join('');
    },
  );

  // Resolve {{#each costings}} ... {{/each}}
  result = result.replace(
    /\{\{#each\s+costings\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, itemTemplate: string) => {
      return data.costings
        .map((item) => {
          let row = itemTemplate;
          row = row.replace(/\{\{this\.id\}\}/g, item.id || '');
          row = row.replace(/\{\{this\.name\}\}/g, item.name || '');
          row = row.replace(/\{\{this\.description\}\}/g, item.description || '');
          row = row.replace(/\{\{this\.quantity\}\}/g, String(item.quantity || 1));
          row = row.replace(/\{\{this\.rate\}\}/g, (item.rate || 0).toFixed(2));
          row = row.replace(/\{\{this\.netTotal\}\}/g, item.netTotal || 'N/A');
          row = row.replace(/\{\{this\.totalPrice\}\}/g, (item.totalPrice || 0).toFixed(2));
          return row;
        })
        .join('');
    },
  );

  // Resolve simple variables
  const vars: Record<string, string> = {
    // Job fields
    'job.id': String(data.job.id),
    'job.titleName': data.job.titleName || '',
    'job.firstName': data.job.firstName || '',
    'job.lastName': data.job.lastName || '',
    'job.estimatedDeliveryDetails': data.job.estimatedDeliveryDetails || '',
    'job.jobValue': data.job.jobValue ? data.job.jobValue.toFixed(2) : '0.00',
    'job.brandCode': data.job.brandCode || '',
    'job.branchCode': data.job.branchCode || '',
    // Addresses
    'job.upliftLine1': data.job.upliftLine1 || '',
    'job.upliftLine2': data.job.upliftLine2 || '',
    'job.upliftCity': data.job.upliftCity || '',
    'job.upliftState': data.job.upliftState || '',
    'job.upliftPostcode': data.job.upliftPostcode || '',
    'job.upliftCountry': data.job.upliftCountry || '',
    'job.deliveryLine1': data.job.deliveryLine1 || '',
    'job.deliveryLine2': data.job.deliveryLine2 || '',
    'job.deliveryCity': data.job.deliveryCity || '',
    'job.deliveryState': data.job.deliveryState || '',
    'job.deliveryPostcode': data.job.deliveryPostcode || '',
    'job.deliveryCountry': data.job.deliveryCountry || '',
    // Measures
    'job.measuresVolumeGrossM3': data.job.measuresVolumeGrossM3?.toFixed(2) || '0.00',
    'job.measuresWeightGrossKg': String(data.job.measuresWeightGrossKg || 0),
    // Branding
    'branding.companyName': data.companyName,
    'branding.logoUrl': data.logoUrl || '',
    'branding.heroBannerUrl': data.heroBannerUrl || data.job.branding?.heroBannerUrl || '',
    'branding.footerImageUrl': data.footerImageUrl || data.job.branding?.footerImageUrl || '',
    'branding.primaryColor': data.primaryColor,
    'branding.secondaryColor': data.job.branding?.secondaryColor || '',
    // Derived
    customerName: data.customerName,
    companyName: data.companyName,
    quoteDate: data.quoteDate,
    expiryDate: data.expiryDate,
    totalCube: data.totalCube.toFixed(2),
    primaryColor: data.primaryColor,
  };

  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key.replace(/\./g, '\\.')}\\}\\}`, 'g'), value);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomLayoutRendererProps {
  config: LayoutConfig;
  data: QuotePageData;
  // Interactive state for the acceptance form — passed through from parent
  selectedCostingId: string | null;
  onSelectCosting: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomLayoutRenderer({
  config,
  data,
  selectedCostingId,
  onSelectCosting,
}: CustomLayoutRendererProps) {
  const globalStyles = config.globalStyles || {};

  // Memoize sanitised custom CSS
  const customCss = useMemo(() => {
    return globalStyles.customCss || '';
  }, [globalStyles.customCss]);

  return (
    <div
      style={{
        fontFamily: globalStyles.fontFamily || 'Inter, sans-serif',
        backgroundColor: globalStyles.backgroundColor || '#f9fafb',
      }}
      className="min-h-screen"
    >
      {/* Global custom CSS */}
      {customCss && <style>{customCss}</style>}

      <div style={{ maxWidth: globalStyles.maxWidth || '1152px' }} className="mx-auto">
        {config.sections
          .filter((s) => s.visible !== false)
          .map((section) => (
            <RenderSection
              key={section.id}
              section={section}
              data={data}
              selectedCostingId={selectedCostingId}
              onSelectCosting={onSelectCosting}
            />
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function RenderSection({
  section,
  data,
  selectedCostingId,
  onSelectCosting,
}: {
  section: LayoutSection;
  data: QuotePageData;
  selectedCostingId: string | null;
  onSelectCosting: (id: string) => void;
}) {
  // ---- Custom HTML section ----
  if (section.type === 'custom_html') {
    const rawHtml = resolveTemplate(section.html || '', data);
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style', 'class', 'id', 'for', 'type', 'placeholder', 'href', 'target', 'onerror'],
    });

    return (
      <div className="mb-6">
        {section.css && <style>{section.css}</style>}
        <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      </div>
    );
  }

  // ---- Built-in section ----
  const cfg = (section.config || {}) as Record<string, unknown>;

  switch (section.component) {
    case 'HeaderSection':
      return <HeaderSection data={data} config={cfg} />;

    case 'IntroSection':
      return <IntroSection data={data} config={cfg} />;

    case 'LocationInfo':
      return <LocationInfo data={data} config={cfg} />;

    case 'EstimateCard':
      return (
        <>
          {data.costings.map((costing: CostingItem, i: number) => (
            <EstimateCard
              key={costing.id}
              costing={costing}
              index={i}
              primaryColor={data.primaryColor}
              selectedCostingId={selectedCostingId}
              onSelect={onSelectCosting}
              config={cfg}
            />
          ))}
        </>
      );

    case 'InventoryTable':
      return (
        <InventoryTable
          inventory={data.inventory}
          primaryColor={data.primaryColor}
          totalCube={data.totalCube}
          config={cfg}
        />
      );

    case 'TermsSection':
      return <TermsSection config={cfg} />;

    // NextStepsForm and AcceptanceForm are handled by the parent page
    // because they require complex state (signature, date picker, form fields).
    // The renderer signals their position via a placeholder.
    case 'NextStepsForm':
      return <div id="custom-layout-next-steps-slot" />;

    case 'AcceptanceForm':
      return <div id="custom-layout-acceptance-slot" />;

    default:
      return null;
  }
}
