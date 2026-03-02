/**
 * Moveware REST API client — server-side only.
 *
 * Makes Basic-Auth requests to the Moveware REST API using per-company
 * credentials stored in BrandingSettings (mwUsername / mwPassword).
 * Credentials are never returned to the browser; all calls are made from
 * Next.js API routes.
 *
 * Base URL: https://rest.moveware-test.app  (test)
 *           https://rest.moveware.app        (production)
 * Override via MOVEWARE_API_BASE_URL environment variable.
 */

import { prisma } from '@/lib/db';

const DEFAULT_BASE_URL =
  process.env.MOVEWARE_API_BASE_URL ?? 'https://rest.moveware-test.app';

// ─────────────────────────────────────────────────────────────────────────────
// Credential helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface MwCredentials {
  /** Moveware company / tenant ID — used in every URL path. */
  coId: string;
  username: string;
  password: string;
  baseUrl: string;
}

/**
 * Load Moveware API credentials for the company identified by `coId` (tenantId).
 * Returns null if credentials have not been configured yet.
 */
export async function getMwCredentials(
  coId: string,
): Promise<MwCredentials | null> {
  try {
    const company = await prisma.company.findFirst({
      where: { tenantId: coId },
      select: {
        tenantId: true,
        // Select all branding settings fields; cast below for mwUsername/mwPassword
        // which are not yet in generated types until `npx prisma generate` is run.
        brandingSettings: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = company?.brandingSettings as any;
    if (!s?.mwUsername || !s?.mwPassword) return null;

    return {
      coId: company!.tenantId,
      username: s.mwUsername as string,
      password: s.mwPassword as string,
      baseUrl: DEFAULT_BASE_URL,
    };
  } catch (err) {
    console.error('[moveware-api] credential lookup failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP transport
// ─────────────────────────────────────────────────────────────────────────────

const MW_HEADERS = (creds: MwCredentials) => ({
  'mw-company-id': creds.coId,
  'mw-username':   creds.username,
  'mw-password':   creds.password,
  Accept:          'application/json',
  'Content-Type':  'application/json',
});

async function mwGet(creds: MwCredentials, path: string): Promise<unknown> {
  const url = `${creds.baseUrl}/${creds.coId}/api/${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: MW_HEADERS(creds),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Moveware API ${res.status} at ${url}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function mwPatch(creds: MwCredentials, path: string, body: unknown): Promise<unknown> {
  const url = `${creds.baseUrl}/${creds.coId}/api/${path}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: MW_HEADERS(creds),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const responseBody = await res.text().catch(() => '');
    throw new Error(`Moveware PATCH ${res.status} at ${url}: ${responseBody.slice(0, 300)}`);
  }
  // Some endpoints return 204 No Content
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function mwPost(creds: MwCredentials, path: string, body: unknown): Promise<unknown> {
  const url = `${creds.baseUrl}/${creds.coId}/api/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: MW_HEADERS(creds),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const responseBody = await res.text().catch(() => '');
    throw new Error(`Moveware POST ${res.status} at ${url}: ${responseBody.slice(0, 300)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Public fetch helpers
// ─────────────────────────────────────────────────────────────────────────────

/** GET /{{coId}}/api/jobs/{{jobId}} */
export async function fetchMwQuotation(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}`);
}

/** GET /{{coId}}/api/jobs/{{jobId}}/options?include=charges */
export async function fetchMwOptions(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}/options?include=charges`);
}

/** GET /{{coId}}/api/jobs/{{jobId}}/quotations/{{quoteId}}?include=options */
export async function fetchMwQuotationOptions(
  creds: MwCredentials,
  jobId: string,
  quoteId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}/quotations/${quoteId}?include=options`);
}

/** GET /{{coId}}/api/jobs/{{jobId}}/reviews — lists review records for the job */
export async function fetchMwReviews(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}/reviews`);
}

/** GET /{{coId}}/api/jobs/{{jobId}}/questions — returns survey/review questions */
export async function fetchMwQuestions(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}/questions`);
}

/** POST /{{coId}}/api/jobs/{{jobId}}/reviews — submits review answers */
export async function postMwReview(
  creds: MwCredentials,
  jobId: string,
  body: unknown,
): Promise<unknown> {
  return mwPost(creds, `jobs/${jobId}/reviews`, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Write-back types
// ─────────────────────────────────────────────────────────────────────────────

export interface MwQuoteAcceptanceInput {
  /** YYYY-MM-DD date of the acceptance */
  quotationDate: string;
}

// Kept for when Moveware's API adds support for sending selected options/charges
// on the quotation PATCH endpoint.
export interface MwQuoteAcceptanceCharge {
  id: string | number;
  description: string;
  value: number;
  valueInc: number;
  valueEx: number;
  quantity: string;
  included: boolean;
}

export interface MwJobActivityInput {
  jobId: string;
  branchCode: string;
  acceptedAt: Date;
  agreedToTerms: boolean;
  signedOnline: boolean;
  loadDate: string;
  insuredValue: string;
  purchaseOrderNumber: string;
  specialRequirements: string;
  /** Human-readable summary of the accepted option(s) and their line items */
  acceptedOptionsSummary: string;
}

/**
 * PATCH /{{coId}}/api/jobs/{{jobId}}/quotations/{{quoteId}}
 *
 * Marks the quotation as Accepted.
 * NOTE: Selected options/charges will be added once Moveware's API supports it.
 */
export async function patchMwQuoteAcceptance(
  creds: MwCredentials,
  jobId: string,
  quoteId: string,
  input: MwQuoteAcceptanceInput,
): Promise<unknown> {
  const body = {
    quotationDate: input.quotationDate,
    status:        'Accepted',
  };

  return mwPatch(creds, `jobs/${jobId}/quotations/${quoteId}`, body);
}

/**
 * PATCH /{{coId}}/api/jobs/{{jobId}}
 *
 * Updates the job status and estimated move date on acceptance.
 * - status: "W" (Won)
 * - estimatedMove.date: the customer's requested relocation date (ISO string)
 */
export async function patchMwJobStatus(
  creds: MwCredentials,
  jobId: string,
  input: { status: string; estimatedMoveDate?: string },
): Promise<unknown> {
  const body: Record<string, unknown> = {
    status: input.status,
  };

  if (input.estimatedMoveDate) {
    body.estimatedMove = { date: input.estimatedMoveDate };
  }

  return mwPatch(creds, `jobs/${jobId}`, body);
}

/**
 * POST /{{coId}}/api/jobs/{{jobId}}/activities
 *
 * Creates a diary entry recording the online quote acceptance.
 */
export async function postMwJobActivity(
  creds: MwCredentials,
  jobId: string,
  input: MwJobActivityInput,
): Promise<unknown> {
  const pad   = (n: number) => String(n).padStart(2, '0');
  const d     = input.acceptedAt;
  const dateStr    = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const startStr   = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  // Full ISO datetime — populates Moveware's dateTime / time column in the diary
  const dateTimeStr = `${dateStr}T${startStr}:00.000`;

  // Normalise to LF-only (\n) — this is what the confirmed working payload uses
  const notes = (input.acceptedOptionsSummary || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const body = {
    activityDate:  dateStr,
    activityHours: startStr,
    activityTime:  String(d.getHours()),
    appointment:   false,
    branch:        input.branchCode || '',
    comment:       'Online Customer Quote Accepted',
    completed:     'Y',
    date:          dateStr,
    dateModified:  dateStr,
    dateTime:      dateTimeStr,
    description:   'Online Customer Quote Accepted',
    diaries:       '',
    keyaction:     'Online Customer Quote Accepted',
    notes,
    parentId:      Number(input.jobId),
    parentNumber:  input.jobId,
    parentType:    'Job',
    type:          'Online Customer Quote Accepted',
  };

  // Step 1: Create the activity
  const created = await mwPost(creds, `jobs/${jobId}/activities`, body) as Record<string, unknown>;

  // Step 2: Immediately PATCH the new activity to mark it completed.
  // Moveware ignores completed:'Y' on POST (the field is read-only at creation);
  // a follow-up PATCH on the returned activity ID is the correct approach.
  const activityId =
    created?.id ??
    (created?.data as Record<string, unknown>)?.id ??
    (created?.links as Record<string, unknown>)?.full;

  if (activityId) {
    try {
      await mwPatch(creds, `jobs/${jobId}/activities/${activityId}`, {
        completed: 'Y',
      });
    } catch (patchErr) {
      // Non-fatal — activity was created; completion tick is best-effort.
      console.warn('[moveware-api] Activity completion PATCH failed:', patchErr);
    }
  } else {
    console.warn('[moveware-api] Could not determine activity ID from POST response — skipping completion PATCH');
  }

  return created;
}

/**
 * GET /{{coId}}/api/jobs/{{jobId}}/inventory
 *
 * Fetches the inventory for a job.  The Moveware REST API returns inventory in
 * pages; we fetch the first page without a pageSize override (the server's
 * default is typically 20–50 items) and log a warning if the response metadata
 * indicates more items are available so a pagination loop can be added later.
 */
export async function fetchMwInventory(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  const raw = await mwGet(creds, `jobs/${jobId}/inventory`);

  // Warn if the response suggests pagination is truncating results
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const meta = r.meta as Record<string, unknown> | undefined;
    const total = meta?.totalItems ?? meta?.total ?? meta?.count;
    const returned = Array.isArray(r.inventoryUsage) ? r.inventoryUsage.length : null;
    if (total != null && returned != null && Number(total) > Number(returned)) {
      console.warn(
        `[moveware-api] inventory truncated: API reports ${total} items but returned ${returned}.` +
        ' Implement pagination to fetch all pages.',
      );
    }
  }

  return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Coerce an unknown value to string, returning '' on null/undefined. */
function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

/** Coerce an unknown value to number, returning 0 on failure. */
function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * Return the first non-null/undefined value found under any of the provided
 * keys on `obj`.  Safe when `obj` is not a plain object.
 */
function pick(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    if (o[k] !== undefined && o[k] !== null) return o[k];
  }
  return undefined;
}

/** Resolve an array from common wrapper shapes: { data:[] }, { items:[] }, or a direct array. */
function toArray(raw: unknown, ...extraKeys: string[]): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const r = raw as Record<string, unknown>;
  for (const key of ['data', 'items', 'results', ...extraKeys]) {
    if (Array.isArray(r?.[key])) return r[key] as Record<string, unknown>[];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal shape types (what the app consumes)
// ─────────────────────────────────────────────────────────────────────────────

export type InternalBranding = {
  companyName: string;
  logoUrl: string;
  heroBannerUrl: string;
  footerImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  /** Unit used to display inventory weights on the quote ('kg' | 'lbs') */
  inventoryWeightUnit: 'kg' | 'lbs';
  /** Footer background colour (default: #ffffff) */
  footerBgColor: string;
  /** Footer body text colour (default: #374151) */
  footerTextColor: string;
  /** First line of company contact address shown in footer */
  footerAddressLine1: string;
  /** Second line of company contact address shown in footer */
  footerAddressLine2: string;
  footerPhone: string;
  footerEmail: string;
  footerAbn: string;
};

export type InternalJob = {
  id: number;
  titleName: string;
  firstName: string;
  lastName: string;
  moveManager: string;
  moveType: string;
  estimatedDeliveryDetails: string;
  jobValue: number;
  brandCode: string;
  branchCode: string;
  upliftLine1: string;
  upliftLine2: string;
  upliftCity: string;
  upliftState: string;
  upliftPostcode: string;
  upliftCountry: string;
  deliveryLine1: string;
  deliveryLine2: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostcode: string;
  deliveryCountry: string;
  measuresVolumeGrossM3: number;
  measuresWeightGrossKg: number;
  branding: InternalBranding;
};

export type InternalCostingCharge = {
  id: number;
  heading: string;
  notes: string;
  quantity: number;
  price: number;
  currency: string;
  currencySymbol: string;
  taxCode: string;
  sort: string;
  included: boolean;
  /** True when oneTotal === "Y" — this is the aggregate base charge for the option */
  isBaseCharge: boolean;
};

export type InternalCosting = {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  rate: number;
  netTotal: string;
  totalPrice: number;
  taxIncluded: boolean;
  currency: string;
  currencySymbol: string;
  charges: InternalCostingCharge[];
  rawData: { inclusions: string[]; exclusions: string[] };
};

export type InternalInventoryItem = {
  id: number;
  description: string;
  room: string;
  quantity: number;
  cube: number;
  typeCode: string;
  /** Gross weight of a single unit in kilograms */
  weightKg: number;
};

/** Aggregate measurement totals extracted from the quotation-level measurements block. */
export type InternalMeasurements = {
  /** Total gross volume in cubic metres (measurements.volume.gross.meters) */
  volumeGrossM3: number;
  /** Total gross weight in kilograms (measurements.weight.gross.kilograms) */
  weightGrossKg: number;
  /** Total gross weight in pounds (measurements.weight.gross.pounds) */
  weightGrossPounds: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Response adapters
// Field names try multiple common Moveware REST API conventions.
// Inspect the raw response in server logs and adjust as needed.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a raw Moveware GET /jobs/{id} response → InternalJob.
 *
 * Field paths confirmed against actual Moveware REST API v1 response shape:
 *   - firstName / lastName / titleName are at the root level
 *   - addresses is an object with keys "origin", "destination", "Uplift", "Delivery"
 *   - measures is an array; volume/weight are nested under measures[0].volume.gross / .weight.gross
 *   - move manager is in roles.salesRepresentative.entity
 */
export function adaptMwQuotation(
  raw: unknown,
  branding: InternalBranding,
): InternalJob {
  const r = raw as Record<string, unknown>;
  // Handle optional { data: {...} } wrapper
  const d: Record<string, unknown> =
    r.data && typeof r.data === 'object'
      ? (r.data as Record<string, unknown>)
      : r;

  // ── Customer name fields — at root level in the Moveware response ──────────
  const titleName = str(pick(d, 'titleName', 'title'));
  const firstName = str(pick(d, 'firstName', 'givenName'));
  const lastName  = str(pick(d, 'lastName', 'surname', 'familyName'));

  // ── Addresses — nested under d.addresses ──────────────────────────────────
  const addresses = (pick(d, 'addresses') ?? {}) as Record<string, unknown>;
  // Prefer the dedicated Uplift/Delivery contacts (have email/phone); fall back to origin/destination
  const origin = (
    pick(addresses, 'Uplift', 'uplift', 'origin') ??
    pick(d, 'uplift', 'origin', 'fromAddress', 'pickupAddress') ??
    {}
  ) as Record<string, unknown>;
  const dest = (
    pick(addresses, 'Delivery', 'delivery', 'destination') ??
    pick(d, 'delivery', 'destination', 'toAddress', 'deliveryAddress') ??
    {}
  ) as Record<string, unknown>;

  // ── Measures — array; first element has volume/weight ─────────────────────
  let measuresVolumeGrossM3 = 0;
  let measuresWeightGrossKg = 0;
  const measuresArr = d.measures;
  if (Array.isArray(measuresArr) && measuresArr.length > 0) {
    const m = measuresArr[0] as Record<string, unknown>;
    // Shape: { volume: { gross: { m3, f3 } }, weight: { gross: { kg, lb } } }
    const vol = (m.volume as Record<string, Record<string, number>> | undefined)?.gross;
    const wt  = (m.weight as Record<string, Record<string, number>> | undefined)?.gross;
    measuresVolumeGrossM3 = num(vol?.m3 ?? vol?.meter);
    measuresWeightGrossKg = num(wt?.kg);
  }

  // ── Move manager — from roles.salesRepresentative.entity ──────────────────
  let moveManager = '';
  const roles = (pick(d, 'roles') ?? {}) as Record<string, unknown>;
  const salesRep = (pick(roles, 'salesRepresentative', 'consultant', 'moveManager') ?? {}) as Record<string, unknown>;
  const repEntity = (pick(salesRep, 'entity') ?? {}) as Record<string, unknown>;
  if (repEntity.firstName || repEntity.lastName) {
    moveManager = `${str(repEntity.firstName)} ${str(repEntity.lastName)}`.trim();
  } else {
    // Fallback: top-level string field
    const mgr = pick(d, 'moveManager', 'consultant', 'assignedTo');
    if (typeof mgr === 'string') moveManager = mgr;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[moveware-api] adapted job:', { id: d.id, firstName, lastName, upliftLine1: origin.line1 });
  }

  return {
    id:        num(pick(d, 'id', 'jobId', 'jobNumber')),
    titleName,
    firstName,
    lastName,
    moveManager,
    moveType: str(pick(d, 'type', 'moveType', 'moveCategory')),
    estimatedDeliveryDetails: str(pick(d, 'estimatedDeliveryDetails', 'estimatedDeliveryDate', 'deliveryDate')),
    jobValue:   num(pick(d, 'jobValue', 'totalValue', 'value', 'total')),
    brandCode:  str(pick(d, 'brandCode', 'brand')),
    branchCode: str(pick(d, 'branchCode', 'branch')),
    // Origin / uplift address
    upliftLine1:    str(pick(origin, 'line1', 'address1', 'street')),
    upliftLine2:    str(pick(origin, 'line2', 'address2')),
    upliftCity:     str(pick(origin, 'city', 'suburb', 'town')),
    upliftState:    str(pick(origin, 'state', 'stateCode')),
    upliftPostcode: str(pick(origin, 'postcode', 'postalCode', 'zip')),
    upliftCountry:  str(pick(origin, 'country', 'countryName', 'countryCode')),
    // Destination / delivery address
    deliveryLine1:    str(pick(dest, 'line1', 'address1', 'street')),
    deliveryLine2:    str(pick(dest, 'line2', 'address2')),
    deliveryCity:     str(pick(dest, 'city', 'suburb', 'town')),
    deliveryState:    str(pick(dest, 'state', 'stateCode')),
    deliveryPostcode: str(pick(dest, 'postcode', 'postalCode', 'zip')),
    deliveryCountry:  str(pick(dest, 'country', 'countryName', 'countryCode')),
    measuresVolumeGrossM3,
    measuresWeightGrossKg,
    branding,
  };
}

/**
 * Map a raw Moveware GET /jobs/{id}/options response → InternalCosting[].
 *
 * The response shape is: { options: [ { id, description, optionNumber,
 *   valueInclusive, valueExclusive, charges: { I: {...}, I2: {...}, ... } } ] }
 *
 * NOTE: charges is a keyed OBJECT (not an array).
 */
export function adaptMwOptions(raw: unknown): InternalCosting[] {
  const items = toArray(raw, 'options', 'costings');

  return items.map((item, idx) => {
    // charges is an object keyed by type code — convert to array of values
    const chargesRaw = pick(item, 'charges', 'lineItems', 'items');
    const charges: Record<string, unknown>[] = Array.isArray(chargesRaw)
      ? chargesRaw
      : chargesRaw && typeof chargesRaw === 'object'
        ? Object.values(chargesRaw as Record<string, unknown>) as Record<string, unknown>[]
        : [];

    // Option description / name
    // Prefer optionDescription (the user-visible summary set in Moveware) over
    // the internal description field.  Fall back to description when blank.
    const optionNumber     = str(pick(item, 'optionNumber', 'number'));
    const description      = str(pick(item, 'description', 'name', 'title', 'label'));
    const optionDescStr    = str(pick(item, 'optionDescription'));
    const displayDesc      = optionDescStr || description;
    const name = displayDesc || `Option ${idx + 1}`;

    // Build inclusions from income charges (type === 'I') that have a description
    const inclusions = charges
      .filter((c) => str(pick(c, 'type')) === 'I' && str(pick(c, 'description')))
      .map((c) => str(pick(c, 'description')))
      .filter(Boolean);

    const exclusions = Array.isArray(item.exclusions)
      ? (item.exclusions as string[])
      : [];

    // Total price: valueInclusive (GST-inc total) from the option
    const totalPrice = num(pick(item, 'valueInclusive', 'totalAmount', 'totalPrice', 'amount', 'total', 'grossTotal'));
    const netRaw     = num(pick(item, 'valueExclusive', 'netAmount', 'netTotal', 'netPrice', 'subTotal'));
    const netTotal   = netRaw > 0 ? netRaw.toFixed(2) : (totalPrice > 0 ? (totalPrice / 1.1).toFixed(2) : '0.00');

    return {
      id:             str(pick(item, 'id', 'optionId', 'costingId') || `opt-${idx}`),
      name,
      category:       str(pick(item, 'category', 'serviceType')),
      description,
      quantity:       num(pick(item, 'quantity', 'qty')) || 1,
      rate:           totalPrice,
      netTotal,
      totalPrice,
      taxIncluded:    pick(item, 'taxIncluded', 'gstIncluded', 'includesTax') !== false,
      currency:       'AUD',
      currencySymbol: '$',
      charges:        [] as InternalCostingCharge[],
      rawData: { inclusions, exclusions },
    };
  });
}

/**
 * Split a bullet-point string (lines separated by \n, optionally prefixed
 * with "• ", "- " or "* ") into a clean string array.
 */
function splitBullets(s: string): string[] {
  return s
    .split('\n')
    .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Map a raw Moveware GET /jobs/{id}/quotations/{quoteId}?include=options
 * response → InternalCosting[].
 *
 * Response shape:
 *   {
 *     id, quotationDate, expiryDate, options: [
 *       {
 *         id, description, optionDescription, optionNumber,
 *         details, inclusions, exclusions, costCenter, service,
 *         charges: [
 *           { id, description, included, rateInclusive, rateExclusive, ... }
 *         ]
 *       }
 *     ]
 *   }
 *
 * Key differences vs. the older /options endpoint:
 *  - options[].charges is an ARRAY (not a keyed object)
 *  - inclusions / exclusions are newline-delimited bullet strings
 *  - the option-level valueInclusive is 0; total must be summed from charges
 *  - only charges with included === true count toward the package price
 */
export function adaptMwQuotationOptions(raw: unknown): InternalCosting[] {
  const r = raw as Record<string, unknown>;
  const options = Array.isArray(r.options)
    ? (r.options as Record<string, unknown>[])
    : [];

  return options.map((option, idx) => {
    const rawCharges = Array.isArray(option.charges)
      ? (option.charges as Record<string, unknown>[])
      : [];

    // Sort charges by the sort key (e.g. "001", "002")
    const sortedCharges = [...rawCharges].sort((a, b) =>
      str(pick(a, 'sort')).localeCompare(str(pick(b, 'sort'))),
    );

    // Map to structured charge line items
    const charges: InternalCostingCharge[] = sortedCharges.map((c) => {
      // Price: prefer rateExclusive; fall back to rateInclusive when exclusive is 0
      // (the base "oneTotal" charge often has rateExclusive=0 but rateInclusive=1050)
      const rateEx = num(pick(c, 'rateExclusive', 'rateEx'));
      const rateIn = num(pick(c, 'rateInclusive', 'rate', 'price'));
      const price  = rateEx > 0 ? rateEx : rateIn;

      // included: handle boolean false, string "false", 0, null, undefined — all = not included
      const rawIncluded = c.included;
      const included =
        rawIncluded === true ||
        rawIncluded === 'true' ||
        rawIncluded === 'Y' ||
        rawIncluded === 1;

      return {
        id:             num(pick(c, 'id')),
        heading:        str(pick(c, 'description')),
        notes:          str(pick(c, 'notes')),
        quantity:       num(pick(c, 'quantity', 'qty')) || 1,
        price,
        currency:       str(pick(c, 'currency')) || 'AUD',
        currencySymbol: str(pick(c, 'currencySymbol')) || '$',
        taxCode:        str(pick(c, 'taxCode')),
        sort:           str(pick(c, 'sort')),
        included,
        isBaseCharge:   c.oneTotal === 'Y' || c.oneTotal === true,
      };
    });

    // Total price: use the option-level valueInclusive; fall back to summing
    // included charges' rateInclusive when the option total isn't populated yet.
    const optionValueInclusive = num(pick(option, 'valueInclusive', 'totalAmount'));
    const chargesSum = rawCharges
      .filter((c) => c.included === true)
      .reduce((sum, c) => sum + num(pick(c, 'rateInclusive', 'valueInclusive')), 0);
    const totalPrice = optionValueInclusive > 0 ? optionValueInclusive : chargesSum;

    const netTotal = totalPrice > 0 ? (totalPrice / 1.1).toFixed(2) : '0.00';

    // Currency from first charge
    const firstCharge = charges[0];
    const currency       = firstCharge?.currency       || 'AUD';
    const currencySymbol = firstCharge?.currencySymbol || '$';

    // Prefer optionDescription (user-visible) over the internal description field
    const description   = str(pick(option, 'description', 'name', 'title', 'label'));
    const optionDescStr = str(pick(option, 'optionDescription'));
    const displayDesc   = optionDescStr || description;
    const name          = displayDesc || `Option ${idx + 1}`;

    // Inclusions / exclusions — newline-separated bullet strings
    const incStr = str(pick(option, 'inclusions'));
    const excStr = str(pick(option, 'exclusions'));
    const inclusions = incStr ? splitBullets(incStr) : [];
    const exclusions = excStr ? splitBullets(excStr) : [];

    return {
      id:             str(pick(option, 'id') || `opt-${idx}`),
      name,
      category:       str(pick(option, 'costCenter', 'service', 'jobType')),
      description:    str(pick(option, 'details')) || description,
      quantity:       1,
      rate:           totalPrice,
      netTotal,
      totalPrice,
      taxIncluded:    true,
      currency,
      currencySymbol,
      charges,
      rawData: { inclusions, exclusions },
    };
  });
}

/**
 * Extract aggregate measurement totals from a raw Moveware quotation response.
 *
 * Expects the top-level shape:
 *   {
 *     measurements: {
 *       volume: { gross: { meters: 0.481, feet: 17.0 }, ... },
 *       weight: { gross: { kilograms: 54.0, pounds: 119.0 }, ... }
 *     }
 *   }
 */
export function adaptMwQuotationMeasurements(raw: unknown): InternalMeasurements {
  const r   = raw as Record<string, unknown>;
  const m   = r.measurements as Record<string, unknown> | undefined;
  const vol      = m?.volume   as Record<string, unknown> | undefined;
  const volGross = vol?.gross  as Record<string, unknown> | undefined;
  const wt       = m?.weight   as Record<string, unknown> | undefined;
  const wtGross  = wt?.gross   as Record<string, unknown> | undefined;

  return {
    volumeGrossM3:     num(volGross?.meters    ?? volGross?.meter    ?? 0),
    weightGrossKg:     num(wtGross?.kilograms  ?? wtGross?.kg        ?? 0),
    weightGrossPounds: num(wtGross?.pounds     ?? wtGross?.lbs       ?? 0),
  };
}

/**
 * Map a raw Moveware GET /jobs/{id}/inventory response → InternalInventoryItem[].
 *
 * The response shape is: { inventoryUsage: [ { id, description, cube,
 *   quantity, room, typeCode, ... } ] }
 */
export function adaptMwInventory(raw: unknown): InternalInventoryItem[] {
  // Root key confirmed as "inventoryUsage" in Moveware REST API v1
  const items = toArray(raw, 'inventoryUsage', 'inventory', 'inventoryItems');

  return items.map((item, idx) => {
    const i = item as Record<string, unknown>;
    const quantity = num(pick(item, 'quantity', 'qty', 'count')) || 1;

    // ── Volume ──────────────────────────────────────────────────────────────
    // Moveware REST returns: volume: { meter, feet, other }
    // Fall back to flat cube / cubetot fields for older API versions.
    const volumeObj  = i['volume'] as Record<string, unknown> | undefined;
    const unitCubeM3 = num(volumeObj?.['meter'] ?? volumeObj?.['other'])
                    || num(pick(item, 'cube', 'cubicMetres', 'm3'));
    const cubetotFlat = num(pick(item, 'cubetot', 'totalCube', 'totalM3'));
    // Line total = pre-multiplied flat OR unit × qty
    const lineCube = cubetotFlat > 0 ? cubetotFlat : unitCubeM3 * quantity;

    // ── Weight ──────────────────────────────────────────────────────────────
    // Moveware REST returns: weight: { kg, lb, totalkg, totallb, volumetric }
    // Use totalkg (qty-multiplied) when available, else unit kg.
    const weightObj = i['weight'] as Record<string, unknown> | undefined;
    const weightKg  = num(weightObj?.['kg']    ?? weightObj?.['totalkg'])
                   || num(pick(item, 'weightKg', 'grossWeight', 'wtGross', 'weightGross', 'unitWeight'));

    return {
      id:          num(pick(item, 'id', 'inventoryId', 'itemId')) || idx + 1,
      description: str(pick(item, 'description', 'itemDescription', 'name', 'number')),
      room:        str(pick(item, 'room', 'roomName', 'location', 'area')),
      quantity,
      cube:        lineCube,
      typeCode:    str(pick(item, 'typeCode', 'type', 'packType', 'category', 'code')),
      weightKg,
    };
  });
}
