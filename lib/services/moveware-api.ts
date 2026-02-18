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

/** GET /{{coId}}/api/jobs/{{jobId}}/quotations */
export async function fetchMwQuotation(
  creds: MwCredentials,
  jobId: string,
): Promise<unknown> {
  return mwGet(creds, `jobs/${jobId}/quotations`);
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

/** Coerce an unknown value to string, returning '' on failure. */
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Coerce an unknown value to number, returning 0 on failure. */
function num(v: unknown): number {
  return typeof v === 'number' ? v : 0;
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
 * Map a raw Moveware quotation response → InternalJob.
 *
 * The Moveware API may return the payload wrapped in { data: {...} }
 * or as a direct object.  Both shapes are handled.
 */
export function adaptMwQuotation(
  raw: unknown,
  branding: InternalBranding,
): InternalJob {
  const r = raw as Record<string, unknown>;
  // Handle { data: {...} } wrapper or direct object
  const d: Record<string, unknown> =
    r.data && typeof r.data === 'object'
      ? (r.data as Record<string, unknown>)
      : r;

  // Customer block
  const customer = (pick(d, 'customer', 'client') ?? {}) as Record<string, unknown>;

  // Address blocks — try multiple field names used by different MW versions
  const origin = (pick(d, 'origin', 'uplift', 'fromAddress', 'pickupAddress') ?? {}) as Record<string, unknown>;
  const dest   = (pick(d, 'destination', 'delivery', 'toAddress', 'deliveryAddress') ?? {}) as Record<string, unknown>;
  const measures = (pick(d, 'measures', 'measurements') ?? {}) as Record<string, unknown>;

  // Move manager may be a string or { name, firstName, lastName }
  const mgr = pick(d, 'moveManager', 'consultant', 'assignedTo');
  let moveManager = '';
  if (typeof mgr === 'string') {
    moveManager = mgr;
  } else if (mgr && typeof mgr === 'object') {
    const m = mgr as Record<string, unknown>;
    moveManager = str(
      m.name ?? m.fullName ?? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[moveware-api] raw quotation response:', JSON.stringify(d, null, 2));
  }

  return {
    id: num(pick(d, 'id', 'jobId', 'jobNumber')),
    titleName: str(pick(customer, 'title', 'titleName')),
    firstName: str(pick(customer, 'firstName', 'givenName', 'first')),
    lastName:  str(pick(customer, 'lastName', 'surname', 'familyName', 'last')),
    moveManager,
    moveType: str(pick(d, 'moveType', 'type', 'moveCategory')),
    estimatedDeliveryDetails: str(
      pick(d, 'estimatedDeliveryDetails', 'estimatedDeliveryDate', 'deliveryDate'),
    ),
    jobValue: num(pick(d, 'jobValue', 'totalValue', 'value', 'total')),
    brandCode:  str(pick(d, 'brandCode', 'brand')),
    branchCode: str(pick(d, 'branchCode', 'branch')),
    // Origin / uplift address
    upliftLine1:    str(pick(origin, 'address1', 'line1', 'street')),
    upliftLine2:    str(pick(origin, 'address2', 'line2')),
    upliftCity:     str(pick(origin, 'city', 'suburb', 'town')),
    upliftState:    str(pick(origin, 'state', 'stateCode')),
    upliftPostcode: str(pick(origin, 'postcode', 'postalCode', 'zip')),
    upliftCountry:  str(pick(origin, 'country', 'countryName', 'countryCode')),
    // Destination / delivery address
    deliveryLine1:    str(pick(dest, 'address1', 'line1', 'street')),
    deliveryLine2:    str(pick(dest, 'address2', 'line2')),
    deliveryCity:     str(pick(dest, 'city', 'suburb', 'town')),
    deliveryState:    str(pick(dest, 'state', 'stateCode')),
    deliveryPostcode: str(pick(dest, 'postcode', 'postalCode', 'zip')),
    deliveryCountry:  str(pick(dest, 'country', 'countryName', 'countryCode')),
    // Measures
    measuresVolumeGrossM3: num(
      pick(measures, 'volumeGrossM3', 'cubicMetres', 'volume', 'grossVolume', 'cubicFeet'),
    ),
    measuresWeightGrossKg: num(
      pick(measures, 'weightGrossKg', 'weightKgs', 'weight', 'grossWeight'),
    ),
    branding,
  };
}

/**
 * Map a raw Moveware options/charges response → InternalCosting[].
 */
export function adaptMwOptions(raw: unknown): InternalCosting[] {
  const items = toArray(raw, 'options', 'costings');

  return items.map((item, idx) => {
    const charges = toArray(pick(item, 'charges', 'lineItems', 'items'));

    // Build a description from charges if none at the top level
    let description = str(pick(item, 'description', 'notes', 'summary'));
    if (!description && charges.length > 0) {
      description = charges
        .map((c) => str(pick(c, 'description', 'name')))
        .filter(Boolean)
        .join('; ');
    }

    const inclusions = Array.isArray(item.inclusions)
      ? (item.inclusions as string[])
      : [];
    const exclusions = Array.isArray(item.exclusions)
      ? (item.exclusions as string[])
      : [];

    const totalPrice = num(
      pick(item, 'totalAmount', 'totalPrice', 'amount', 'total', 'grossTotal'),
    );
    const netRaw = num(
      pick(item, 'netAmount', 'netTotal', 'netPrice', 'subTotal'),
    );
    const netTotal = netRaw > 0 ? netRaw.toFixed(2) : (totalPrice / 1.1).toFixed(2);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[moveware-api] option[${idx}] raw:`, JSON.stringify(item, null, 2));
    }

    return {
      id: str(pick(item, 'id', 'optionId', 'costingId') ?? `opt-${idx}`),
      name: str(pick(item, 'name', 'title', 'optionName', 'label')) || `Option ${idx + 1}`,
      category: str(pick(item, 'category', 'type', 'serviceType')),
      description,
      quantity: num(pick(item, 'quantity', 'qty')) || 1,
      rate: totalPrice,
      netTotal,
      totalPrice,
      taxIncluded: pick(item, 'taxIncluded', 'gstIncluded', 'includesTax') !== false,
      rawData: { inclusions, exclusions },
    };
  });
}

/**
 * Map a raw Moveware inventory response → InternalInventoryItem[].
 */
export function adaptMwInventory(raw: unknown): InternalInventoryItem[] {
  const items = toArray(raw, 'inventory', 'inventoryItems');

  return items.map((item, idx) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[moveware-api] inventory[${idx}] raw:`, JSON.stringify(item, null, 2));
    }

    return {
      id: num(pick(item, 'id', 'inventoryId', 'itemId')) || idx + 1,
      description: str(
        pick(item, 'description', 'itemDescription', 'name', 'itemName'),
      ),
      room: str(pick(item, 'room', 'roomName', 'location', 'area')),
      quantity: num(pick(item, 'quantity', 'qty', 'count')) || 1,
      cube: num(
        pick(item, 'cube', 'cubicMetres', 'volume', 'cubicFeet', 'm3'),
      ),
      typeCode: str(
        pick(item, 'typeCode', 'type', 'packType', 'category', 'code'),
      ),
    };
  });
}
