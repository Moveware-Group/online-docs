'use client';

import { Card } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'neutral',
  description 
}: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendBgColor = () => {
    if (trend === 'up') return 'bg-green-50';
    if (trend === 'down') return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          
          {change !== undefined && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-sm text-gray-500">vs last period</span>
            </div>
          )}
          
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
        
        <div className={`p-3 rounded-lg ${getTrendBgColor()}`}>
          <Icon className={`h-6 w-6 ${getTrendColor()}`} />
        </div>
      </div>
    </Card>
  );
}
