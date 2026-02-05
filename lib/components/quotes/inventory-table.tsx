import { InventoryItem } from '@/lib/types/quote';
import { Package, AlertCircle } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  const totalVolume = items.reduce((sum, item) => sum + item.volume * item.quantity, 0);
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.weight || 0) * item.quantity,
    0
  );

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Inventory
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {items.length} item types • {totalVolume.toFixed(1)} m³ • {totalWeight.toFixed(0)} kg
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              {category}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Volume (m³)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Total Volume
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          {item.fragile && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                              title="Fragile item - handle with care"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Fragile
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        {item.volume.toFixed(1)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        {item.weight ? item.weight.toFixed(0) : '-'}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                        {(item.volume * item.quantity).toFixed(1)} m³
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-end">
          <div className="space-y-2">
            <div className="flex justify-between gap-12">
              <span className="text-sm font-medium text-gray-600">Total Volume:</span>
              <span className="text-sm font-bold text-gray-900">{totalVolume.toFixed(1)} m³</span>
            </div>
            <div className="flex justify-between gap-12">
              <span className="text-sm font-medium text-gray-600">Total Weight:</span>
              <span className="text-sm font-bold text-gray-900">{totalWeight.toFixed(0)} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
