'use client';

import { useState } from 'react';
import type { CostingItem, SectionConfig } from './types';

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

  const subtotal = costing.totalPrice || 0;
  const totalAmount = subtotal;
  const inclusions = costing.rawData?.inclusions || [];
  const exclusions = costing.rawData?.exclusions || [];

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="px-6 py-4" style={{ backgroundColor: primaryColor }}>
        <div className="flex justify-between items-center text-white">
          <h3 className="text-xl font-bold">Your Estimate</h3>
          <div className="text-right">
            <div className="text-2xl font-bold">(AUD) A${totalAmount.toFixed(2)}</div>
            <div className="text-sm">Tax included</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">{costing.name}</h4>
            <p className="text-sm text-gray-600">
              Qty: {costing.quantity || 1} | Rate: A${(costing.rate || 0).toFixed(2)} | NT: {costing.netTotal || 'N/A'}
            </p>
          </div>
          <div className="text-right font-bold text-gray-900">A${(costing.totalPrice || 0).toFixed(2)}</div>
        </div>
        <p className="text-sm text-gray-700 mt-2">{costing.description}</p>
      </div>

      <div className="px-6 py-4 border-b border-gray-200">
        <div className="space-y-2 text-right">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Subtotal</span>
            <span>A${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Tax</span>
            <span>N/A</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span>Total</span>
            <span>A${totalAmount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-600">Tax Included</p>
        </div>
      </div>

      <div className="px-6 py-4 text-right">
        <button
          onClick={() => onSelect(costing.id)}
          style={{ backgroundColor: selectedCostingId === costing.id ? '#22c55e' : primaryColor }}
          className="px-6 py-2 text-white font-semibold rounded hover:opacity-90 transition-all"
        >
          {selectedCostingId === costing.id ? '\u2713 Selected' : 'Select Option'}
        </button>
      </div>

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
          <div className="px-6 py-4 bg-gray-50">
            {inclusions.length > 0 && (
              <div className="mb-4">
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
    </div>
  );
}
