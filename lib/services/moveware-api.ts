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

async function mwGet(creds: MwCredentials, path: string): Promise<unknown> {
  const url = `${creds.baseUrl}/${creds.coId}/api/${path}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'mw-company-id': creds.coId,
      'mw-username':   creds.username,
      'mw-password':   creds.password,
      Accept:          'application/json',
      'Content-Type':  'application/json',
    },
    // Always fetch fresh — job data changes frequently
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Moveware API ${res.status} at ${url}: ${body.slice(0, 300)}`,
    );
  }

  return res.json();
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

/** GET /{{coId}}/api/jobs/{{jobId}}/inventory */
export async function fetchMwInventory(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}/inventory`);
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
  rawData: { inclusions: string[]; exclusions: string[] };
};

export type InternalInventoryItem = {
  id: number;
  description: string;
  room: string;
  quantity: number;
  cube: number;
  typeCode: string;
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
    const optionNumber = str(pick(item, 'optionNumber', 'number'));
    const optionDesc   = str(pick(item, 'description', 'optionDescription', 'name', 'title', 'label'));
    const name = optionDesc
      ? (optionNumber ? `Option ${optionNumber}: ${optionDesc}` : optionDesc)
      : `Option ${idx + 1}`;

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
      id:          str(pick(item, 'id', 'optionId', 'costingId') || `opt-${idx}`),
      name,
      category:    str(pick(item, 'category', 'serviceType')),
      description: optionDesc,
      quantity:    num(pick(item, 'quantity', 'qty')) || 1,
      rate:        totalPrice,
      netTotal,
      totalPrice,
      taxIncluded: pick(item, 'taxIncluded', 'gstIncluded', 'includesTax') !== false,
      rawData: { inclusions, exclusions },
    };
  });
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

  return items.map((item, idx) => ({
    id:          num(pick(item, 'id', 'inventoryId', 'itemId')) || idx + 1,
    description: str(pick(item, 'description', 'itemDescription', 'name', 'number')),
    room:        str(pick(item, 'room', 'roomName', 'location', 'area')),
    quantity:    num(pick(item, 'quantity', 'qty', 'count')) || 1,
    // cube is a top-level field in inventoryUsage items (confirmed)
    cube:        num(pick(item, 'cube', 'cubetot', 'cubicMetres', 'm3')),
    typeCode:    str(pick(item, 'typeCode', 'type', 'packType', 'category', 'code')),
  }));
}
