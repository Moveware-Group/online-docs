'use client';

import type { QuotePageData, SectionConfig } from './types';

interface Props {
  data: QuotePageData;
  config?: SectionConfig;
}

export function HeaderSection({ data, config }: Props) {
  const showBanner = config?.showBanner !== false;
  const bannerImageUrl =
    (config?.bannerImageUrl as string) ||
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop';

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt={data.companyName}
                style={{ maxWidth: '250px' }}
                className="w-auto object-contain mb-6"
              />
            ) : (
              <h1 className="text-2xl font-bold mb-6" style={{ color: data.primaryColor }}>
                {data.companyName}
              </h1>
            )}
            <h2 className="text-3xl font-bold text-gray-900">Your Moving Quote</h2>
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Prepared For:</span> {data.customerName}</p>
              <p><span className="font-medium">Reference:</span> #{data.job.id}</p>
              <p><span className="font-medium">Quote Date:</span> {data.quoteDate}</p>
              <p><span className="font-medium">Expiry Date:</span> {data.expiryDate}</p>
            </div>
          </div>
          {showBanner && (
            <div className="hidden md:block">
              <div className="rounded-xl overflow-hidden shadow-md" style={{ maxHeight: '250px' }}>
                <img
                  src={bannerImageUrl}
                  alt="Professional moving services"
                  className="w-full h-full object-cover"
                  style={{ maxHeight: '250px' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
