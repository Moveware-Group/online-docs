'use client';

import { useState } from 'react';
import type { InventoryItem, SectionConfig } from './types';

const KG_TO_LBS = 2.20462;

interface Props {
  inventory: InventoryItem[];
  primaryColor: string;
  totalCube: number;
  /** Unit for the weight column. Defaults to 'kg'. */
  weightUnit?: 'kg' | 'lbs';
  config?: SectionConfig;
}

export function InventoryTable({ inventory, primaryColor, weightUnit = 'kg', config }: Props) {
  const defaultPageSize = (config?.defaultPageSize as number) || 10;

  const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize);
  const [currentPage, setCurrentPage]   = useState(1);

  if (inventory.length === 0) return null;

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(inventory.length / itemsPerPage);
  const paginated  =
    itemsPerPage === -1
      ? inventory
      : inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Convert a kg value to the display unit and format it. */
  const fmtWeight = (kg: number | undefined) => {
    if (!kg && kg !== 0) return '-';
    const v = weightUnit === 'lbs' ? kg * KG_TO_LBS : kg;
    return v.toFixed(0);
  };

  const totalItems  = inventory.reduce((s, i) => s + (i.quantity || 1), 0);
  const totalWeight = inventory.reduce((s, i) => {
    const w = i.weightKg ?? 0;
    const q = i.quantity || 1;
    return s + w * q;
  }, 0);
  const totalWeightDisplay =
    weightUnit === 'lbs'
      ? `${(totalWeight * KG_TO_LBS).toFixed(0)} lbs`
      : `${totalWeight.toFixed(0)} kg`;
  const totalVolume = inventory.reduce((s, i) => s + (i.cube ?? 0), 0);

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex justify-between items-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <h3 className="text-lg font-bold">Your Estimated Inventory</h3>
        <button
          onClick={() => setItemsPerPage(itemsPerPage === -1 ? 10 : -1)}
          className="text-xs opacity-80 hover:opacity-100 transition-opacity no-print"
        >
          {itemsPerPage === -1 ? '▲ Collapse' : '▼ Show all'}
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white">
              <th className="px-4 py-3 text-left font-medium text-gray-700">Room</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Quantity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Item</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Weight ({weightUnit === 'lbs' ? 'lbs' : 'Kg'})
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{item.room || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{item.quantity || 1}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{item.description}</td>
                <td className="px-4 py-3 text-gray-700">{fmtWeight(item.weightKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {itemsPerPage !== -1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            {/* First */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 disabled:opacity-40 hover:bg-gray-100 text-xs"
            >
              ⟪
            </button>
            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 disabled:opacity-40 hover:bg-gray-100 text-xs"
            >
              ‹
            </button>
            {/* Current page pill */}
            <span
              className="w-7 h-7 flex items-center justify-center rounded text-xs font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {currentPage}
            </span>
            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 disabled:opacity-40 hover:bg-gray-100 text-xs"
            >
              ›
            </button>
            {/* Last */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 disabled:opacity-40 hover:bg-gray-100 text-xs"
            >
              ⟫
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {currentPage} of {totalPages} pages ({inventory.length} items)
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Summary totals ──────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-gray-200 space-y-1 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Total number of items to move: <strong>{totalItems}</strong>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Total Volume: <strong>{totalVolume.toFixed(0)} ft³</strong>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          Total weight: <strong>{totalWeightDisplay}</strong>
        </div>
      </div>
    </div>
  );
}
