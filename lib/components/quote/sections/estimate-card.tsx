'use client';

import { useState } from 'react';
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

  const totalAmount    = costing.totalPrice || 0;
  const currencyCode   = costing.currency       || 'AUD';
  const currencySymbol = costing.currencySymbol  || '$';
  const inclusions     = costing.rawData?.inclusions || [];
  const exclusions     = costing.rawData?.exclusions || [];
  const charges        = costing.charges || [];

  // Split charges into included (package) and optional (not included)
  const includedCharges  = charges.filter((c) => c.included);
  const optionalCharges  = charges.filter((c) => !c.included);

  const isSelected = selectedCostingId === costing.id;

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">

      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4" style={{ backgroundColor: primaryColor }}>
        <div className="flex justify-between items-center text-white">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide opacity-75 mb-0.5">
              Option {index + 1}
            </div>
            <h3 className="text-xl font-bold">{costing.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ({currencyCode}) {currencySymbol}{totalAmount.toFixed(2)}
            </div>
            <div className="text-sm opacity-80">Tax included</div>
          </div>
        </div>
      </div>

      {/* ── Service description ──────────────────────────────────────────────── */}
      {costing.description && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-700">{costing.description}</p>
        </div>
      )}

      {/* ── Included charge line items ───────────────────────────────────────── */}
      {includedCharges.length > 0 && (
        <div className="border-b border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-2 text-left font-semibold text-gray-600">Description</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-600 w-16">Qty</th>
                <th className="px-6 py-2 text-right font-semibold text-gray-600 w-32">Price</th>
              </tr>
            </thead>
            <tbody>
              {includedCharges.map((charge: CostingCharge) => (
                <tr key={charge.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{charge.heading}</div>
                    {charge.notes && (
                      <div className="text-xs text-gray-500 mt-0.5">{charge.notes}</div>
                    )}
                    {charge.taxCode && charge.taxCode !== 'NT' && (
                      <div className="text-xs text-gray-400 mt-0.5">Tax: {charge.taxCode}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{charge.quantity}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    {charge.currencySymbol}{charge.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Total ───────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Tax included</p>
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

      {/* ── Details accordion ───────────────────────────────────────────────── */}
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
          <div className="px-6 py-4 bg-gray-50 space-y-6">

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

            {optionalCharges.length > 0 && (
              <div>
                <h5 className="font-bold text-gray-900 mb-2">Optional Add-ons</h5>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left font-semibold text-gray-600">Item</th>
                      <th className="pb-2 text-center font-semibold text-gray-600 w-16">Qty</th>
                      <th className="pb-2 text-right font-semibold text-gray-600 w-28">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionalCharges.map((charge: CostingCharge) => (
                      <tr key={charge.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2">
                          <div className="font-medium text-gray-900">{charge.heading}</div>
                          {charge.notes && (
                            <div className="text-xs text-gray-500 mt-0.5">{charge.notes}</div>
                          )}
                        </td>
                        <td className="py-2 text-center text-gray-700">{charge.quantity}</td>
                        <td className="py-2 text-right text-gray-700">
                          {charge.currencySymbol}{charge.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
