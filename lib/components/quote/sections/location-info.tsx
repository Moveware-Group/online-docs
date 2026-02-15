'use client';

import type { QuotePageData, SectionConfig } from './types';

interface Props {
  data: QuotePageData;
  config?: SectionConfig;
}

export function LocationInfo({ data, config }: Props) {
  const layout = (config?.layout as string) || 'two-column';

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Location Information</h3>
      <div className={layout === 'stacked' ? 'space-y-6' : 'grid md:grid-cols-2 gap-6'}>
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Origin Address</h4>
          <div className="text-gray-600 text-sm space-y-1">
            <p>{data.job.upliftLine1}</p>
            {data.job.upliftLine2 && <p>{data.job.upliftLine2}</p>}
            <p>
              {data.job.upliftCity}, {data.job.upliftState} {data.job.upliftPostcode}
            </p>
            <p>{data.job.upliftCountry}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Destination Address</h4>
          <div className="text-gray-600 text-sm space-y-1">
            <p>{data.job.deliveryLine1}</p>
            {data.job.deliveryLine2 && <p>{data.job.deliveryLine2}</p>}
            <p>
              {data.job.deliveryCity}, {data.job.deliveryState} {data.job.deliveryPostcode}
            </p>
            <p>{data.job.deliveryCountry}</p>
          </div>
        </div>
      </div>

      {data.job.estimatedDeliveryDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700">
            Scheduled Move Date{' '}
            <span className="font-bold" style={{ color: data.primaryColor }}>
              {data.job.estimatedDeliveryDetails}
            </span>
          </h4>
        </div>
      )}
    </div>
  );
}
