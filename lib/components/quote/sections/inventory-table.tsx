'use client';

import { useState } from 'react';
import type { InventoryItem, SectionConfig } from './types';

const KG_TO_LBS  = 2.20462;
const M3_TO_FT3  = 35.3147;

interface Props {
  inventory: InventoryItem[];
  primaryColor: string;
  totalCube: number;
  /** Unit for weight and volume columns ('kg' = metric m³, 'lbs' = imperial ft³). Defaults to 'kg'. */
  weightUnit?: 'kg' | 'lbs';
  /**
   * When provided, use this as the total volume instead of summing individual
   * item cubes. Sourced from measurements.volume.gross.meters on the quotation.
   */
  totalVolumeM3Override?: number;
  /**
   * When provided, use this as the total weight instead of summing item weights.
   * Sourced from measurements.weight.gross.kilograms on the quotation.
   */
  totalWeightKgOverride?: number;
  config?: SectionConfig;
}

export function InventoryTable({
  inventory,
  primaryColor,
  weightUnit = 'kg',
  totalVolumeM3Override,
  totalWeightKgOverride,
  config,
}: Props) {
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

  const totalItems = inventory.reduce((s, i) => s + (i.quantity || 1), 0);

  // Weight: prefer API-provided total (measurements.weight.gross.kilograms),
  // fall back to summing individual item weights × quantity.
  const totalWeightKg =
    totalWeightKgOverride !== undefined
      ? totalWeightKgOverride
      : inventory.reduce((s, i) => s + (i.weightKg ?? 0) * (i.quantity || 1), 0);

  const totalWeightDisplay =
    weightUnit === 'lbs'
      ? `${(totalWeightKg * KG_TO_LBS).toFixed(0)} lbs`
      : `${totalWeightKg.toFixed(0)} kg`;

  // Volume: prefer API-provided total (measurements.volume.gross.meters),
  // fall back to summing individual item cubes.
  const totalVolumeM3 =
    totalVolumeM3Override !== undefined
      ? totalVolumeM3Override
      : inventory.reduce((s, i) => s + (i.cube ?? 0), 0);

  // Display volume in m³ (metric) or ft³ (imperial)
  const volumeDisplay =
    weightUnit === 'lbs'
      ? `${(totalVolumeM3 * M3_TO_FT3).toFixed(2)} ft³`
      : `${totalVolumeM3.toFixed(2)} m³`;

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
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{totalItems}</td>
              <td className="px-4 py-3 text-xs text-gray-500">
                Volume: <strong>{volumeDisplay}</strong>
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{totalWeightDisplay}</td>
            </tr>
          </tfoot>
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

    </div>
  );
}
