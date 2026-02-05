import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'emerald' | 'teal' | 'indigo';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    gradient: 'from-blue-500/10 to-blue-500/5',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    gradient: 'from-green-500/10 to-green-500/5',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    gradient: 'from-purple-500/10 to-purple-500/5',
  },
  yellow: {
    bg: 'bg-yellow-100',
    icon: 'text-yellow-600',
    gradient: 'from-yellow-500/10 to-yellow-500/5',
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    gradient: 'from-orange-500/10 to-orange-500/5',
  },
  emerald: {
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  teal: {
    bg: 'bg-teal-100',
    icon: 'text-teal-600',
    gradient: 'from-teal-500/10 to-teal-500/5',
  },
  indigo: {
    bg: 'bg-indigo-100',
    icon: 'text-indigo-600',
    gradient: 'from-indigo-500/10 to-indigo-500/5',
  },
};

export function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  color = 'blue',
}: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-white rounded-xl border border-gray-200',
        'p-6 transition-all duration-300',
        'hover:shadow-lg hover:border-gray-300',
        'hover:-translate-y-1'
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          colors.gradient
        )}
      />

      {/* Content */}
      <div className="relative space-y-4">
        {/* Icon and Trend */}
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300',
              colors.bg,
              'group-hover:scale-110'
            )}
          >
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                trend.isPositive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Value and Label */}
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </div>
          <div className="text-sm font-medium text-gray-600">{label}</div>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-gray-200 transition-all duration-300" />
    </div>
  );
}
