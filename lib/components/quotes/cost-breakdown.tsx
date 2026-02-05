import { CostBreakdown } from '@/lib/types/quote';
import { DollarSign } from 'lucide-react';

interface CostBreakdownProps {
  costings: CostBreakdown;
}

export function CostBreakdownCard({ costings }: CostBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: costings.currency,
    }).format(amount);
  };

  const groupedItems = costings.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof costings.items>);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-blue-600" />
          Cost Breakdown
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Detailed pricing for your move
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              {category}
            </h3>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between py-2 hover:bg-gray-50 px-3 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-gray-700">Subtotal</span>
          <span className="text-base font-semibold text-gray-900">
            {formatCurrency(costings.subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-gray-700">
            Tax ({(costings.taxRate * 100).toFixed(0)}%)
          </span>
          <span className="text-base font-semibold text-gray-900">
            {formatCurrency(costings.tax)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="text-xl font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(costings.total)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          Accept Quote
        </button>
        <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
          Request Changes
        </button>
      </div>
    </div>
  );
}
