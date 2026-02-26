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
  const currencyCode   = costing.currency      || 'AUD';
  const currencySymbol = costing.currencySymbol || '$';
  const inclusions     = costing.rawData?.inclusions || [];
  const exclusions     = costing.rawData?.exclusions || [];

  // Base charge: the aggregate total line (oneTotal === "Y")
  const baseCharge      = charges.find((c) => c.isBaseCharge) ?? null;
  const includedCharges = charges.filter((c) => !c.isBaseCharge && c.included);
  const optionalCharges = charges.filter((c) => !c.isBaseCharge && !c.included);

  // Optional selections — none selected by default (user opts in)
  const defaultSelected = useMemo(
    () => new Set<number>(),
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

  // Base amount = the actual base charge line price (not the full option valueInclusive)
  const baseAmount    = baseCharge ? baseCharge.price * baseCharge.quantity : (costing.totalPrice ?? 0);
  const includedTotal = includedCharges.reduce((s, c) => s + c.price * c.quantity, 0);
  const optionalTotal = optionalCharges
    .filter((c) => selectedOptionals.has(c.id))
    .reduce((s, c) => s + c.price * c.quantity, 0);
  const dynamicTotal  = baseAmount + includedTotal + optionalTotal;

  const isSelected = selectedCostingId === costing.id;

  const fmt = (p: number) =>
    `${currencySymbol}${p.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">

      {/* ── Coloured header ─────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex justify-between items-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="text-lg font-bold">{costing.name}</span>
        <div className="text-right">
          <div className="text-xl font-bold">
            ({currencyCode}) {fmt(dynamicTotal)}
          </div>
          <div className="text-xs opacity-80">Tax Included where applicable</div>
        </div>
      </div>

      {/* ── Charges table ───────────────────────────────────────────────────── */}
      <table className="w-full text-sm">

        {/* Column sub-header */}
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-2 text-left text-xs font-normal text-gray-500">
              Services
            </th>
            <th className="px-4 py-2 text-center text-xs font-normal text-gray-500 w-24">Quantity</th>
            <th className="px-4 py-2 text-center text-xs font-normal text-gray-500 w-28">Rate</th>
            <th className="px-6 py-2 text-right text-xs font-normal text-gray-500 w-32">
              {fmt(baseAmount)}
            </th>
          </tr>
        </thead>

        <tbody>
          {/* ── Base service row — use the job/service description, not the option name ── */}
          {baseCharge && (
            <tr className="border-b border-gray-100">
              <td className="px-6 py-3">
                <span className="font-semibold text-gray-900">
                  {costing.description || costing.notes || baseCharge.heading || costing.name}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-gray-700">{baseCharge.quantity}</td>
              <td className="px-4 py-3 text-center text-gray-700">{fmt(baseCharge.price)}</td>
              <td className="px-6 py-3 text-right font-semibold" style={{ color: primaryColor }}>
                {fmt(baseAmount)}
              </td>
            </tr>
          )}

          {/* ── Always-included non-base charges ──────────────────────────── */}
          {includedCharges.map((charge: CostingCharge) => (
            <tr key={charge.id} className="border-b border-gray-100">
              <td className="px-6 py-3">
                <span className="font-semibold text-gray-900">{charge.heading}</span>
                {charge.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{charge.notes}</p>
                )}
              </td>
              <td className="px-4 py-3 text-center text-gray-700">{charge.quantity}</td>
              <td className="px-4 py-3 text-center text-gray-700">{fmt(charge.price)}</td>
              <td className="px-6 py-3 text-right font-semibold text-gray-900">
                {fmt(charge.price * charge.quantity)}
              </td>
            </tr>
          ))}

          {/* ── Optional Services heading ──────────────────────────────────── */}
          {optionalCharges.length > 0 && (
            <tr className="border-b border-gray-100">
              <td colSpan={4} className="px-6 py-2">
                <span className="text-sm font-bold" style={{ color: primaryColor }}>
                  Optional Services
                </span>
              </td>
            </tr>
          )}

          {/* ── Optional charges (interactive checkboxes) ─────────────────── */}
          {optionalCharges.map((charge: CostingCharge) => {
            const checked = selectedOptionals.has(charge.id);
            return (
              <tr
                key={charge.id}
                className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOptional(charge.id)}
              >
                <td className="px-6 py-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
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
                    <div>
                      <span className="font-medium text-gray-900">{charge.heading}</span>
                      {charge.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{charge.notes}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{charge.quantity}</td>
                <td className="px-4 py-3 text-center text-gray-700">{fmt(charge.price)}</td>
                <td className="px-6 py-3 text-right font-semibold text-gray-900">
                  {fmt(charge.price * charge.quantity)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Totals (right-aligned) ───────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex gap-8">
            <span className="text-gray-600">Ex Tax</span>
            <span className="w-28 text-right text-gray-700">{fmt(dynamicTotal)}</span>
          </div>
          <div className="flex gap-8">
            <span className="text-gray-600">Tax</span>
            <span className="w-28 text-right text-gray-700">$0.00</span>
          </div>
          <div className="flex gap-8 font-bold text-base pt-1 border-t border-gray-300 mt-1">
            <span>Total</span>
            <span className="w-28 text-right" style={{ color: primaryColor }}>{fmt(dynamicTotal)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Tax Included</p>
        </div>
      </div>

      {/* ── Select button ────────────────────────────────────────────────────── */}
      <div className="px-6 pb-5 flex justify-end">
        <button
          onClick={() => onSelect(costing.id)}
          style={{ backgroundColor: isSelected ? '#22c55e' : primaryColor }}
          className="px-8 py-2 text-white font-bold rounded hover:opacity-90 transition-all"
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
