'use client';

import type { QuotePageData, SectionConfig } from './types';

interface Props {
  data: QuotePageData;
  config?: SectionConfig;
}

export function IntroSection({ data, config }: Props) {
  const template = (config?.template as string) || 'letter';
  const customText = config?.customText as string | undefined;

  if (template === 'custom' && customText) {
    return (
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Quotation Number: {data.job.id}</h3>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">{customText}</div>
      </div>
    );
  }

  if (template === 'brief') {
    return (
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quotation #{data.job.id}</h3>
        <p className="text-gray-700">
          Dear {data.job.titleName} {data.job.lastName}, please review your moving quote below.
          This quotation is valid for 28 days. Select your preferred pricing option and accept to confirm.
        </p>
      </div>
    );
  }

  // Default: letter template
  return (
    <div className="bg-white rounded-lg shadow p-8 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Quotation Number: {data.job.id}</h3>
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>Dear {data.job.titleName} {data.job.lastName},</p>
        <p>
          Thank you for contacting us for your upcoming move. Below you will find our pricing,
          tailored to meet your specific moving requirements.
        </p>
        <p>Please note this quotation is valid for 28 days from the quotation date.</p>
        <p>
          To confirm a booking with us, simply select the pricing option that you prefer and
          accept after filling in all information we need. And of course, should you have any
          questions about this quote, please do not hesitate to contact us.
        </p>
        <p>We look forward to being at your service.</p>
        <p className="font-semibold mt-6">{data.companyName} Admin</p>
      </div>
    </div>
  );
}
