'use client';

import type { SectionConfig } from './types';

interface Props {
  config?: SectionConfig;
}

export function TermsSection({ config }: Props) {
  const customTerms = config?.terms as string[] | undefined;

  const defaultTerms = [
    'This quote is valid for 30 days from the date of issue.',
    'All prices are in Australian Dollars (AUD) and include GST.',
    'Final pricing may vary based on actual inventory and conditions.',
    'Payment: 50% deposit to confirm, balance due on completion.',
    'Cancellation: Full refund if cancelled 7+ days before move date.',
  ];

  const terms = customTerms || defaultTerms;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Terms &amp; Conditions</h3>
      <ul className="text-sm text-gray-600 space-y-2">
        {terms.map((term, i) => (
          <li key={i}>&bull; {term}</li>
        ))}
      </ul>
    </div>
  );
}
