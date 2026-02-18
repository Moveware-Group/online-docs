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
import type { LayoutConfig, LayoutSection, SectionCondition } from '@/lib/services/llm-service';

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-notation field path (e.g. "job.brandCode") against QuotePageData.
 * Returns undefined when the path does not exist.
 */
function resolveFieldValue(field: string, data: QuotePageData): unknown {
  const parts = field.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Evaluate a SectionCondition against live QuotePageData.
 * Returns true when the condition is satisfied (block should be shown).
 */
function evaluateCondition(condition: SectionCondition, data: QuotePageData): boolean {
  const raw = resolveFieldValue(condition.field, data);
  const fieldStr = (raw ?? '').toString().toLowerCase().trim();
  const testValue = (condition.value ?? '').toLowerCase().trim();

  switch (condition.operator) {
    case '==':          return fieldStr === testValue;
    case '!=':          return fieldStr !== testValue;
    case 'contains':    return fieldStr.includes(testValue);
    case 'startsWith':  return fieldStr.startsWith(testValue);
    case 'endsWith':    return fieldStr.endsWith(testValue);
    case 'isBlank':     return fieldStr === '';
    case 'isNotBlank':  return fieldStr !== '';
    default:            return true;
  }
}

// ---------------------------------------------------------------------------
// Template variable resolver
// ---------------------------------------------------------------------------

/**
 * Simple Handlebars-like template resolver.
 * Supports: {{variable}}, {{#each array}} ... {{/each}}, {{config.key}}
 *
 * @param sectionConfig  Optional section-level config (stored on the LayoutSection).
 *                       Each key becomes available as {{config.key}} in the HTML.
 */
function resolveTemplate(
  html: string,
  data: QuotePageData,
  sectionConfig?: Record<string, unknown>,
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
    // Staff
    moveManager: data.job.moveManager || '',
    'job.moveType': data.job.moveType || '',
    moveType: data.job.moveType || '',
    // Derived
    customerName: data.customerName,
    companyName: data.companyName,
    quoteDate:        data.quoteDate,
    quoteDateLong:    data.quoteDateLong    || '',
    quoteDateFull:    data.quoteDateFull    || '',
    quoteDateMedium:  data.quoteDateMedium  || '',
    expiryDate:       data.expiryDate,
    expiryDateLong:   data.expiryDateLong   || '',
    expiryDateFull:   data.expiryDateFull   || '',
    expiryDateMedium: data.expiryDateMedium || '',
    totalCube: data.totalCube.toFixed(2),
    primaryColor: data.primaryColor,
    // Inventory pagination
    inventoryFrom: String(data.inventoryFrom ?? 1),
    inventoryTo: String(data.inventoryTo ?? data.inventory.length),
    inventoryTotal: String(data.inventoryTotal ?? data.inventory.length),
    inventoryCurrentPage: String(data.inventoryCurrentPage ?? 1),
    inventoryTotalPages: String(data.inventoryTotalPages ?? 1),
  };

  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key.replace(/\./g, '\\.')}\\}\\}`, 'g'), value);
  }

  // Resolve {{config.KEY}} from section-level config
  if (sectionConfig) {
    for (const [key, value] of Object.entries(sectionConfig)) {
      if (value !== null && value !== undefined) {
        result = result.replace(
          new RegExp(`\\{\\{config\\.${key.replace(/\./g, '\\.')}\\}\\}`, 'g'),
          String(value),
        );
      }
    }
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
  /**
   * When the layout contains an AcceptanceForm built-in section this slot is
   * rendered in its place.  This allows the parent page to inject the full
   * React acceptance form (with SignatureCanvas, DatePicker, etc.) into the
   * otherwise static custom layout.
   */
  acceptanceFormSlot?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomLayoutRenderer({
  config,
  data,
  selectedCostingId,
  onSelectCosting,
  acceptanceFormSlot,
}: CustomLayoutRendererProps) {
  const globalStyles = config.globalStyles || {};

  // Memoize sanitised custom CSS
  const customCss = useMemo(() => {
    return globalStyles.customCss || '';
  }, [globalStyles.customCss]);

  // ---------------------------------------------------------------------------
  // Grace banner height CSS
  // Injects per-layout config heights with !important so they override the
  // global defaults in globals.css.  Positioning is handled entirely by
  // globals.css (.grace-hero-wrap / .grace-footer-wrap rules) so we only
  // need to emit height overrides here.
  // ---------------------------------------------------------------------------
  const graceBannerCss = useMemo(() => {
    const heroSection = config.sections.find((s) => s.id === 'grace-hero');
    const footerSection = config.sections.find((s) => s.id === 'grace-footer-image');
    if (!heroSection && !footerSection) return '';

    const heroC = (heroSection?.config || {}) as Record<string, unknown>;
    const footC = (footerSection?.config || {}) as Record<string, unknown>;

    const hD = Number(heroC.desktopMaxHeight  || 500);
    const hT = Number(heroC.tabletMaxHeight   || 350);
    const hM = Number(heroC.mobileMaxHeight   || 250);
    const fD = Number(footC.desktopMaxHeight  || 500);
    const fT = Number(footC.tabletMaxHeight   || 350);
    const fM = Number(footC.mobileMaxHeight   || 250);

    return `
      .grace-hero-wrap   { height: ${hD}px !important; }
      .grace-footer-wrap { height: ${fD}px !important; }
      @media (max-width: 1024px) {
        .grace-hero-wrap   { height: ${hT}px !important; }
        .grace-footer-wrap { height: ${fT}px !important; }
      }
      @media (max-width: 640px) {
        .grace-hero-wrap   { height: ${hM}px !important; }
        .grace-footer-wrap { height: ${fM}px !important; }
      }
    `;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.sections]);

  return (
    <div
      style={{
        fontFamily: globalStyles.fontFamily || 'Inter, sans-serif',
        backgroundColor: globalStyles.backgroundColor || '#f9fafb',
        // No overflowX: 'hidden' here — that would clip the full-width breakout
        // technique used in custom_html sections (position:relative; left:50%;
        // margin-left:-50vw; width:100vw). Overflow is handled at the body level.
      }}
      className="min-h-screen"
    >
      {/* Global custom CSS */}
      {customCss && <style>{customCss}</style>}
      {/* Grace banner corrective CSS — overrides stale stored styles */}
      {graceBannerCss && <style>{graceBannerCss}</style>}

      {config.sections
        .filter((s) => {
          if (s.visible === false) return false;
          // Evaluate optional display condition
          if (s.condition) return evaluateCondition(s.condition, data);
          return true;
        })
        .map((section) => {
          // custom_html sections manage their own full-width layout internally
          // (header/hero/footer use the 100vw breakout technique), so they must
          // render at the document root level — not inside a maxWidth container.
          if (section.type === 'custom_html') {
            return (
              <RenderSection
                key={section.id}
                section={section}
                data={data}
                selectedCostingId={selectedCostingId}
                onSelectCosting={onSelectCosting}
                acceptanceFormSlot={acceptanceFormSlot}
              />
            );
          }

          // Built-in component sections (HeaderSection, EstimateCard, etc.) are
          // centred within the configured maxWidth.
          // AcceptanceForm is the exception — its slot manages its own wrapper.
          if (section.component === 'AcceptanceForm' && acceptanceFormSlot) {
            return (
              <RenderSection
                key={section.id}
                section={section}
                data={data}
                selectedCostingId={selectedCostingId}
                onSelectCosting={onSelectCosting}
                acceptanceFormSlot={acceptanceFormSlot}
              />
            );
          }

          return (
            <div
              key={section.id}
              style={{ maxWidth: globalStyles.maxWidth || '1152px' }}
              className="mx-auto px-4"
            >
              <RenderSection
                section={section}
                data={data}
                selectedCostingId={selectedCostingId}
                onSelectCosting={onSelectCosting}
                acceptanceFormSlot={acceptanceFormSlot}
              />
            </div>
          );
        })}
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
  acceptanceFormSlot,
}: {
  section: LayoutSection;
  data: QuotePageData;
  selectedCostingId: string | null;
  onSelectCosting: (id: string) => void;
  acceptanceFormSlot?: React.ReactNode;
}) {
  // ---- Custom HTML section ----
  if (section.type === 'custom_html') {
    const rawHtml = resolveTemplate(
      section.html || '',
      data,
      section.config as Record<string, unknown> | undefined,
    );
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style', 'class', 'id', 'for', 'type', 'placeholder', 'href', 'target', 'onerror', 'data-dir', 'data-costing-id'],
    });

    // custom_html sections manage their own spacing via inline styles
    return (
      <>
        {section.css && <style>{section.css}</style>}
        <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      </>
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
      return acceptanceFormSlot ? <>{acceptanceFormSlot}</> : <div id="custom-layout-acceptance-slot" />;

    default:
      return null;
  }
}
