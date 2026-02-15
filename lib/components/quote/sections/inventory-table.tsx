'use client';

import { useState } from 'react';
import type { InventoryItem, SectionConfig } from './types';

interface Props {
  inventory: InventoryItem[];
  primaryColor: string;
  totalCube: number;
  config?: SectionConfig;
}

export function InventoryTable({ inventory, primaryColor, totalCube, config }: Props) {
  const defaultPageSize = (config?.defaultPageSize as number) || 10;
  const showRoom = config?.showRoom !== false;
  const showType = config?.showType !== false;

  const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  if (inventory.length === 0) return null;

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(inventory.length / itemsPerPage);
  const paginated =
    itemsPerPage === -1
      ? inventory
      : inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Complete Inventory</h3>
        <div className="no-print flex items-center gap-3">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ outlineColor: primaryColor }}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:border-transparent transition-colors"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={-1}>All</option>
          </select>
          <span className="text-sm text-gray-600">items per page</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (m&sup3;)</th>
              {showType && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.description}</div>
                  {showRoom && item.room && <div className="text-xs text-gray-500">Room: {item.room}</div>}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-900">{item.quantity || 1}</td>
                <td className="px-6 py-4 text-center text-sm text-gray-900">{item.cube?.toFixed(2) || '0.00'}</td>
                {showType && (
                  <td className="px-6 py-4 text-center">
                    <span
                      className="inline-block px-2 py-1 text-xs font-medium rounded"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {item.typeCode || 'N/A'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
              <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                {inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)}
              </td>
              <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">{totalCube.toFixed(2)}</td>
              {showType && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {itemsPerPage !== -1 && totalPages > 1 && (
        <div className="no-print px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, inventory.length)} of {inventory.length} items
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ borderColor: primaryColor, color: primaryColor }}
              className="px-3 py-1 border rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ borderColor: primaryColor, color: primaryColor }}
              className="px-3 py-1 border rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
