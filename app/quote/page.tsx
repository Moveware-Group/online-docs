'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { Loader2, AlertCircle } from 'lucide-react';
import SignatureCanvas from '@/lib/components/forms/signature-canvas';

interface Job {
  id: number;
  titleName?: string;
  firstName?: string;
  lastName?: string;
  estimatedDeliveryDetails?: string;
  jobValue?: number;
  brandCode?: string;
  branchCode?: string;
  
  // Addresses
  upliftLine1?: string;
  upliftLine2?: string;
  upliftCity?: string;
  upliftState?: string;
  upliftPostcode?: string;
  upliftCountry?: string;
  
  deliveryLine1?: string;
  deliveryLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostcode?: string;
  deliveryCountry?: string;
  
  // Measures
  measuresVolumeGrossM3?: number;
  measuresWeightGrossKg?: number;
  
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface InventoryItem {
  id: number;
  description?: string;
  room?: string;
  quantity?: number;
  cube?: number;
  typeCode?: string;
}

interface CostingItem {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  quantity?: number;
  rate?: number;
  netTotal?: string;
  totalPrice?: number;
  taxIncluded?: boolean;
  rawData?: {
    inclusions?: string[];
    exclusions?: string[];
  };
}

function QuotePageContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const companyId = searchParams.get('coId');
  
  const [job, setJob] = useState<Job | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [costings, setCostings] = useState<CostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for signature section
  const [signatureName, setSignatureName] = useState('');
  const [reloFromDate, setReloFromDate] = useState('');
  const [insuredValue, setInsuredValue] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [signature, setSignature] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDetailsIndex, setShowDetailsIndex] = useState<number | null>(null);
  const [selectedCostingId, setSelectedCostingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (jobId && companyId) {
      fetchJobData(jobId, companyId);
    } else {
      setError('Missing required parameters: jobId and coId are required');
      setLoading(false);
    }
  }, [jobId, companyId]);

  // Auto-select if there's only one costing option
  useEffect(() => {
    if (costings.length === 1 && !selectedCostingId) {
      setSelectedCostingId(costings[0].id);
    }
  }, [costings, selectedCostingId]);

  const fetchJobData = async (jobIdParam: string, coIdParam: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job details with company ID
      const jobResponse = await fetch(`/api/jobs/${jobIdParam}?coId=${coIdParam}`);
      const jobResult = await jobResponse.json();

      if (!jobResponse.ok || !jobResult.success) {
        throw new Error(jobResult.error || 'Failed to load job');
      }

      // Fetch inventory with company ID
      const inventoryResponse = await fetch(`/api/jobs/${jobIdParam}/inventory?coId=${coIdParam}`);
      const inventoryResult = await inventoryResponse.json();

      // Fetch costings with company ID
      const costingsResponse = await fetch(`/api/jobs/${jobIdParam}/costings?coId=${coIdParam}`);
      const costingsResult = await costingsResponse.json();

      setJob(jobResult.data);
      setInventory(inventoryResult.data || []);
      setCostings(costingsResult.data || []);
    } catch (err) {
      console.error('Error fetching job data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const syncFromMoveware = async () => {
    if (!jobId || !companyId) return;
    
    try {
      setSyncing(true);
      
      const syncResponse = await fetch(`/api/jobs/${jobId}/sync?coId=${companyId}`, {
        method: 'POST',
      });
      
      const syncResult = await syncResponse.json();

      if (!syncResponse.ok || !syncResult.success) {
        throw new Error(syncResult.error || 'Failed to sync data');
      }

      // Refresh the page data
      await fetchJobData(jobId, companyId);
    } catch (err) {
      console.error('Error syncing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync data from Moveware');
    } finally {
      setSyncing(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!selectedCostingId) {
      alert('Please select a pricing option');
      return;
    }

    if (!signatureName || !reloFromDate || !insuredValue || !purchaseOrderNumber || !signature) {
      alert('Please fill in all required fields');
      return;
    }

    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId,
          costingItemId: selectedCostingId,
          signatureName,
          reloFromDate,
          insuredValue,
          purchaseOrderNumber,
          specialRequirements,
          signatureData: signature,
          agreedToTerms,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to accept quote');
      }

      alert('Quote accepted successfully! We will contact you shortly.');
      
      // Optionally redirect or reset form
      // window.location.href = '/thank-you';
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell includeHeader={false}>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading quote details...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !job) {
    return (
      <PageShell includeHeader={false}>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Quote</h2>
            <p className="text-gray-600 mb-6">{error || 'Job not found'}</p>
            <button
              onClick={() => jobId && companyId && fetchJobData(jobId, companyId)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const customerName = `${job.titleName || ''} ${job.firstName || ''} ${job.lastName || ''}`.trim();
  const companyName = job.branding?.companyName || 'MOVEWARE';
  const logoUrl = job.branding?.logoUrl;
  const primaryColor = job.branding?.primaryColor || '#1E40AF';
  const totalCube = inventory.reduce((sum, item) => sum + (item.cube || 0), 0);

  // Format date to DD/MM/YYYY (Australian format)
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const quoteDate = formatDate(new Date());
  const expiryDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  return (
    <PageShell includeHeader={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Quote Header with Logo and Banner */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Left - Logo and Title */}
              <div>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={companyName}
                    style={{ maxWidth: '250px' }}
                    className="w-auto object-contain mb-6"
                  />
                ) : (
                  <h1 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>{companyName}</h1>
                )}
                <h2 className="text-3xl font-bold text-gray-900">Your Moving Quote</h2>
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Prepared For:</span> {customerName}</p>
                  <p><span className="font-medium">Reference:</span> #{job.id}</p>
                  <p><span className="font-medium">Quote Date:</span> {quoteDate}</p>
                  <p><span className="font-medium">Expiry Date:</span> {expiryDate}</p>
                </div>
              </div>

              {/* Right - Banner Image */}
              <div className="hidden md:block">
                <div className="rounded-xl overflow-hidden shadow-md" style={{ maxHeight: '250px' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop" 
                    alt="Professional moving services"
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '250px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-8 py-8">
          
          {/* Location Information */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Location Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Origin */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Origin Address</h4>
                <div className="text-gray-600 text-sm space-y-1">
                  <p>{job.upliftLine1}</p>
                  {job.upliftLine2 && <p>{job.upliftLine2}</p>}
                  <p>{job.upliftCity}, {job.upliftState} {job.upliftPostcode}</p>
                  <p>{job.upliftCountry}</p>
                </div>
              </div>

              {/* Destination */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Destination Address</h4>
                <div className="text-gray-600 text-sm space-y-1">
                  <p>{job.deliveryLine1}</p>
                  {job.deliveryLine2 && <p>{job.deliveryLine2}</p>}
                  <p>{job.deliveryCity}, {job.deliveryState} {job.deliveryPostcode}</p>
                  <p>{job.deliveryCountry}</p>
                </div>
              </div>
            </div>

            {/* Move Date */}
            {job.estimatedDeliveryDetails && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700">
                  Scheduled Move Date <span className="font-bold" style={{ color: primaryColor }}>{job.estimatedDeliveryDetails}</span>
                </h4>
              </div>
            )}
          </div>

          {/* Estimate Section */}
          {costings.length > 0 && costings.map((costing, index) => {
            const subtotal = costing.totalPrice || 0;
            const totalAmount = subtotal;
            const inclusions = costing.rawData?.inclusions || [];
            const exclusions = costing.rawData?.exclusions || [];
            
            return (
              <div key={costing.id} className="bg-white rounded-lg shadow mb-6">
                {/* Header */}
                <div className="px-6 py-4" style={{ backgroundColor: primaryColor }}>
                  <div className="flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold">Your Estimate</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold">(AUD) A${totalAmount.toFixed(2)}</div>
                      <div className="text-sm">Tax included</div>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{costing.name}</h4>
                      <p className="text-sm text-gray-600">
                        Qty: {costing.quantity || 1} | Rate: A${(costing.rate || 0).toFixed(2)} | NT: {costing.netTotal || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right font-bold text-gray-900">
                      A${(costing.totalPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{costing.description}</p>
                </div>

                {/* Summary */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Subtotal</span>
                      <span>A${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Tax</span>
                      <span>N/A</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                      <span>Total</span>
                      <span>A${totalAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-600">Tax Included</p>
                  </div>
                </div>

                {/* Select Option Button */}
                <div className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedCostingId(costing.id)}
                    style={{ backgroundColor: selectedCostingId === costing.id ? '#22c55e' : primaryColor }}
                    className="px-6 py-2 text-white font-semibold rounded hover:opacity-90 transition-all"
                  >
                    {selectedCostingId === costing.id ? '✓ Selected' : 'Select Option'}
                  </button>
                </div>

                {/* Details Accordion */}
                <div className="border-t border-gray-300">
                  <button
                    onClick={() => setShowDetailsIndex(showDetailsIndex === index ? null : index)}
                    className="w-full px-6 py-4 flex justify-between items-center bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">Details</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${showDetailsIndex === index ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDetailsIndex === index && (
                    <div className="px-6 py-4 bg-gray-50">
                      {inclusions.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-bold text-gray-900 mb-2">Inclusions</h5>
                          <ul className="space-y-1">
                            {inclusions.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {exclusions.length > 0 && (
                        <div>
                          <h5 className="font-bold text-gray-900 mb-2">Exclusions</h5>
                          <ul className="space-y-1">
                            {exclusions.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Inventory Section */}
          {inventory.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Complete Inventory</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (m³)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.description}</div>
                          {item.room && <div className="text-xs text-gray-500">Room: {item.room}</div>}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{item.quantity || 1}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{item.cube?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {item.typeCode || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                        {inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                        {totalCube.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Next Steps Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
            
            {/* Horizontal Steps Indicator */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-3" style={{ backgroundColor: primaryColor }}>
                  1
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Review Your Quote</h4>
                <p className="text-sm text-gray-600">Please review all details including the inventory list, services, and pricing.</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-3" style={{ backgroundColor: primaryColor }}>
                  2
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Contact Us</h4>
                <p className="text-sm text-gray-600">If you have any questions or need adjustments, our team is here to help.</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-3" style={{ backgroundColor: primaryColor }}>
                  3
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Confirm Your Booking</h4>
                <p className="text-sm text-gray-600">Once you're ready, confirm your booking to secure your move date.</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-6 border-t pt-6">
              To confirm the service, please fill in the fields below, sign and accept. If the pricing options are not matching your requirements, 
              please decline the quote and provide the information as for the reasons why and we will make sure to update our quote if requested.
            </p>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: primaryColor }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relo From date: DD/MM/YYYY <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reloFromDate}
                    onChange={(e) => setReloFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: primaryColor }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insured value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={insuredValue}
                    onChange={(e) => setInsuredValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: primaryColor }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase order number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: primaryColor }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add any special requirements here
                </label>
                <textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: primaryColor }}
                />
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="mb-6">
              <SignatureCanvas
                value={signature}
                onChange={setSignature}
              />
            </div>

            {/* Terms Checkbox */}
            <div className="mb-6">
              <a href="#" className="hover:underline text-sm inline-flex items-center gap-1 mb-3" style={{ color: primaryColor }}>
                Read Terms & Conditions here
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <span className="text-sm text-gray-700">I have read and agree to your Terms & Conditions</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors">
                Decline
              </button>
              <button 
                style={{ backgroundColor: primaryColor }}
                className="flex-1 px-6 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity"
              >
                Create PDF
              </button>
              <button 
                onClick={handleAcceptQuote}
                disabled={!agreedToTerms || submitting}
                style={{ backgroundColor: agreedToTerms ? primaryColor : '#e5e7eb' }}
                className="flex-1 px-6 py-3 text-white font-semibold rounded transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Accept'}
              </button>
            </div>
          </div>

          {/* Terms & Conditions - Moved to end */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Terms & Conditions</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• This quote is valid for 30 days from the date of issue.</li>
              <li>• All prices are in Australian Dollars (AUD) and include GST.</li>
              <li>• Final pricing may vary based on actual inventory and conditions.</li>
              <li>• Payment: 50% deposit to confirm, balance due on completion.</li>
              <li>• Cancellation: Full refund if cancelled 7+ days before move date.</li>
            </ul>
          </div>

        </div>
      </div>
    </PageShell>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={
      <PageShell includeHeader={false}>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading quote...</p>
          </div>
        </div>
      </PageShell>
    }>
      <QuotePageContent />
    </Suspense>
  );
}
