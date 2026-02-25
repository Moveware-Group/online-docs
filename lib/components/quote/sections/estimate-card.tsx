'use client';

import { useState, useMemo } from 'react';
import type { CostingItem, CostingCharge, SectionConfig } from './types';

interface Props {
  costing: CostingItem;
  index: number;
  primaryColor: string;
  selectedCostingId: string | null;
  onSelect: (id: string) => void;
  config?: SectionConfig;
}

export function EstimateCard({
  costing,
  index,
  primaryColor,
  selectedCostingId,
  onSelect,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const charges        = costing.charges || [];
  const currencyCode   = costing.currency       || 'AUD';
  const currencySymbol = costing.currencySymbol  || '$';
  const inclusions     = costing.rawData?.inclusions || [];
  const exclusions     = costing.rawData?.exclusions || [];

  // Base charge: the aggregate total line (oneTotal === "Y")
  const baseCharge = charges.find((c) => c.isBaseCharge) ?? null;

  // Included non-base charges: always in the price, shown as plain rows
  const includedCharges = charges.filter((c) => !c.isBaseCharge && c.included);

  // Optional charges: not included by default, shown with checkboxes
  const optionalCharges = charges.filter((c) => !c.isBaseCharge && !c.included);

  // Default optional selections: pre-check those with included=true (none by default,
  // but kept as a Set so the user can toggle freely).
  const defaultSelected = useMemo(
    () => new Set(optionalCharges.filter((c) => c.included).map((c) => c.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [costing.id],
  );
  const [selectedOptionals, setSelectedOptionals] = useState<Set<number>>(defaultSelected);

  const toggleOptional = (id: number) => {
    setSelectedOptionals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Dynamic total = base + all included non-base + selected optional charges
  const basePrice     = baseCharge?.price ?? 0;
  const includedTotal = includedCharges.reduce((s, c) => s + c.price * c.quantity, 0);
  const optionalTotal = optionalCharges
    .filter((c) => selectedOptionals.has(c.id))
    .reduce((s, c) => s + c.price * c.quantity, 0);
  const dynamicTotal  = basePrice + includedTotal + optionalTotal;

  const isSelected = selectedCostingId === costing.id;

  const fmt = (p: number) =>
    `${currencySymbol}${p.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex justify-between items-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <h3 className="text-lg font-bold">Option {index + 1}</h3>
        <div className="text-right">
          <div className="text-xl font-bold">
            ({currencyCode}) {fmt(dynamicTotal)}
          </div>
          <div className="text-xs opacity-80">Tax included</div>
        </div>
      </div>

      {/* ── Base service row ─────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <div className="font-bold text-gray-900">{costing.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Qty: {baseCharge?.quantity ?? 1}
              {' | '}Rate: {fmt(baseCharge?.price ?? 0)}
              {' | '}NT: {costing.netTotal && costing.netTotal !== '0.00' ? fmt(Number(costing.netTotal)) : 'N/A'}
            </div>
            {costing.description && (
              <p className="text-sm mt-1" style={{ color: primaryColor }}>
                {costing.description}
              </p>
            )}
          </div>
          <div className="font-semibold text-gray-900 whitespace-nowrap">
            {fmt(baseCharge?.price ?? 0)}
          </div>
        </div>
      </div>

      {/* ── Always-included non-base charges (plain rows, no checkbox) ──────── */}
      {includedCharges.map((charge: CostingCharge) => (
        <div
          key={charge.id}
          className="px-6 py-3 flex justify-between items-start border-b border-gray-100"
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="font-medium text-gray-900">{charge.heading}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Qty: {charge.quantity}
              {' | '}Rate: {fmt(charge.price)}
              {' | '}NT: N/A
            </div>
            {charge.notes && (
              <div className="text-xs text-gray-500 mt-0.5">{charge.notes}</div>
            )}
          </div>
          <div className="font-semibold text-gray-900 whitespace-nowrap">{fmt(charge.price)}</div>
        </div>
      ))}

      {/* ── Optional / add-on charges (checkboxes) ───────────────────────────── */}
      {optionalCharges.length > 0 && (
        <>
          <div className="px-6 pt-3 pb-1 border-b border-gray-100">
            <span className="text-sm font-bold" style={{ color: primaryColor }}>
              Optional Services
            </span>
          </div>
          {optionalCharges.map((charge: CostingCharge) => {
            const checked = selectedOptionals.has(charge.id);
            return (
              <div
                key={charge.id}
                className="px-6 py-3 flex items-start justify-between border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOptional(charge.id)}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor:     checked ? primaryColor : '#9ca3af',
                      backgroundColor: checked ? primaryColor : 'transparent',
                    }}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">{charge.heading}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Qty: {charge.quantity}
                      {' | '}Rate: {fmt(charge.price)}
                      {' | '}NT: N/A
                    </div>
                    {charge.notes && (
                      <div className="text-xs text-gray-500 mt-0.5">{charge.notes}</div>
                    )}
                  </div>
                </div>
                <div className="font-semibold text-gray-900 whitespace-nowrap ml-4">
                  {fmt(charge.price)}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── Totals ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="space-y-1 text-sm text-right">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Subtotal</span>
            <span>{fmt(dynamicTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Tax</span>
            <span>N/A</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
            <span>Total</span>
            <span>{fmt(dynamicTotal)}</span>
          </div>
          <p className="text-xs text-gray-400">Tax Included</p>
        </div>
      </div>

      {/* ── Select button ───────────────────────────────────────────────────── */}
      <div className="px-6 py-4 text-right">
        <button
          onClick={() => onSelect(costing.id)}
          style={{ backgroundColor: isSelected ? '#22c55e' : primaryColor }}
          className="px-6 py-2 text-white font-semibold rounded hover:opacity-90 transition-all"
        >
          {isSelected ? '\u2713 Selected' : 'Select Option'}
        </button>
      </div>

      {/* ── Details accordion (inclusions / exclusions) ──────────────────────── */}
      {(inclusions.length > 0 || exclusions.length > 0) && (
        <div className="border-t border-gray-300">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <span className="font-semibold text-gray-800">Details</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDetails && (
            <div className="px-6 py-4 bg-gray-50 space-y-4">
              {inclusions.length > 0 && (
                <div>
                  <h5 className="font-bold text-gray-900 mb-2">Inclusions</h5>
                  <ul className="space-y-1">
                    {inclusions.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700">&bull; {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {exclusions.length > 0 && (
                <div>
                  <h5 className="font-bold text-gray-900 mb-2">Exclusions</h5>
                  <ul className="space-y-1">
                    {exclusions.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700">&bull; {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
