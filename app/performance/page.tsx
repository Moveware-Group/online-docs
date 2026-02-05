import { PageShell } from '@/lib/components/layout';
import { MetricCard } from '@/lib/components/performance/metric-card';
import {
  TrendingUp,
  Package,
  Star,
  Clock,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
} from 'lucide-react';

export default function PerformancePage() {
  // In a real application, this data would come from an API or database
  const metrics = [
    {
      id: 'total-moves',
      label: 'Total Moves',
      value: '247',
      trend: { value: 12.5, isPositive: true },
      icon: Package,
      color: 'blue' as const,
    },
    {
      id: 'avg-rating',
      label: 'Average Rating',
      value: '4.8',
      trend: { value: 5.2, isPositive: true },
      icon: Star,
      color: 'yellow' as const,
    },
    {
      id: 'response-time',
      label: 'Avg Response Time',
      value: '2.4h',
      trend: { value: 15.3, isPositive: false },
      icon: Clock,
      color: 'purple' as const,
    },
    {
      id: 'satisfaction',
      label: 'Customer Satisfaction',
      value: '94%',
      trend: { value: 3.1, isPositive: true },
      icon: Users,
      color: 'green' as const,
    },
    {
      id: 'revenue',
      label: 'Revenue This Month',
      value: '$48,293',
      trend: { value: 8.7, isPositive: true },
      icon: DollarSign,
      color: 'emerald' as const,
    },
    {
      id: 'active-quotes',
      label: 'Active Quotes',
      value: '23',
      trend: { value: 18.2, isPositive: true },
      icon: FileText,
      color: 'orange' as const,
    },
    {
      id: 'completion-rate',
      label: 'Completion Rate',
      value: '97.3%',
      trend: { value: 2.4, isPositive: true },
      icon: CheckCircle,
      color: 'teal' as const,
    },
    {
      id: 'trending-moves',
      label: 'Trending This Week',
      value: '42',
      trend: { value: 24.1, isPositive: true },
      icon: TrendingUp,
      color: 'indigo' as const,
    },
  ];

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Performance Overview
          </h1>
          <p className="text-lg text-gray-600">
            Track your key metrics and business performance at a glance.
          </p>
        </div>

        {/* Time Period Selector (Optional Enhancement) */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Period:</span>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm transition-all">
              Today
            </button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm transition-all">
              Week
            </button>
            <button className="px-3 py-1.5 rounded-md bg-white shadow-sm text-gray-900 font-medium">
              Month
            </button>
            <button className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm transition-all">
              Year
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              icon={metric.icon}
              color={metric.color}
            />
          ))}
        </div>

        {/* Additional Insights Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Strong Performance This Month
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You're on track to exceed your monthly goals. Customer satisfaction
                is at an all-time high, and your response times have improved significantly.
                Keep up the great work!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                View Detailed Reports
              </span>
            </div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left group">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Manage Active Moves
              </span>
            </div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left group">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Customer Feedback
              </span>
            </div>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
