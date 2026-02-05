'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { Loader2, AlertCircle } from 'lucide-react';

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

export default function JobQuotePage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      const jobResult = await jobResponse.json();

      if (!jobResponse.ok || !jobResult.success) {
        throw new Error(jobResult.error || 'Failed to load job');
      }

      // Fetch inventory
      const inventoryResponse = await fetch(`/api/jobs/${jobId}/inventory`);
      const inventoryResult = await inventoryResponse.json();

      setJob(jobResult.data);
      setInventory(inventoryResult.data || []);
    } catch (err) {
      console.error('Error fetching job data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const syncFromMoveware = async () => {
    try {
      setSyncing(true);
      
      const syncResponse = await fetch(`/api/jobs/${jobId}/sync`, {
        method: 'POST',
      });
      
      const syncResult = await syncResponse.json();

      if (!syncResponse.ok || !syncResult.success) {
        throw new Error(syncResult.error || 'Failed to sync data');
      }

      // Refresh the page data
      await fetchJobData();
    } catch (err) {
      console.error('Error syncing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync data from Moveware');
    } finally {
      setSyncing(false);
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
              onClick={fetchJobData}
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

  return (
    <PageShell includeHeader={false}>
      <div className="min-h-screen bg-white">
        {/* Modern Hero Header */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-8 py-12">
            {/* Sync Button - Top Right */}
            <div className="absolute top-4 right-8 z-10">
              <button
                onClick={syncFromMoveware}
                disabled={syncing}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-md border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data from Moveware API"
              >
                <svg 
                  className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Logo and Quote Details */}
              <div className="space-y-8">
                {/* Company Logo */}
                <div className="inline-block">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={companyName}
                      className="h-20 w-auto object-contain"
                    />
                  ) : (
                    <div className="bg-white px-8 py-4 rounded-xl shadow-lg border-2 border-gray-200">
                      <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>{companyName}</h1>
                    </div>
                  )}
                </div>

                {/* Quote Title */}
                <div>
                  <h2 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    Your Moving Quote
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Prepared For</span>
                      <span className="text-xl font-semibold text-gray-900">{customerName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Reference</span>
                      <span className="text-xl font-semibold" style={{ color: primaryColor }}>#{job.id}</span>
                    </div>
                    {job.estimatedDeliveryDetails && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quote Date</span>
                        <span className="text-xl font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Expiry Date</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Hero Image */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  {/* Placeholder for hero image - you can replace with actual image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 via-blue-50 to-white relative">
                    {/* Image overlay with modern design */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <svg className="w-16 h-16" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Journey Starts Here</h3>
                        <p className="text-gray-600">Professional moving services tailored to your needs</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative corner accent */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: primaryColor }}></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: primaryColor }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z" fill="white" opacity="0.3"></path>
              <path d="M0,20 C200,80 400,20 600,60 C800,100 1000,40 1200,80 L1200,120 L0,120 Z" fill="white"></path>
            </svg>
          </div>
        </div>

        {/* Introduction */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl p-10 shadow-lg border border-gray-200">
            <div className="flex items-start">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Moving Journey</h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-4">
                  Thank you for choosing <span className="font-semibold text-blue-900">{companyName}</span> for your moving needs. We're pleased to provide you with this detailed quotation 
                  for your upcoming move. Our team is committed to making your relocation as smooth and stress-free as possible.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  This quote includes all the services we discussed, a complete inventory of items to be moved, and a transparent 
                  breakdown of costs. Please review the details carefully, and don't hesitate to contact us if you have any questions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Location Information</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Origin */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border-2 border-blue-100 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Origin Address</h4>
                </div>
                <div className="text-gray-700 space-y-1 text-lg">
                  <p className="font-medium">{job.upliftLine1}</p>
                  {job.upliftLine2 && <p>{job.upliftLine2}</p>}
                  <p>{job.upliftCity}, {job.upliftState} {job.upliftPostcode}</p>
                  <p className="text-gray-600">{job.upliftCountry}</p>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border-2 border-green-100 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Destination Address</h4>
                </div>
                <div className="text-gray-700 space-y-1 text-lg">
                  <p className="font-medium">{job.deliveryLine1}</p>
                  {job.deliveryLine2 && <p>{job.deliveryLine2}</p>}
                  <p>{job.deliveryCity}, {job.deliveryState} {job.deliveryPostcode}</p>
                  <p className="text-gray-600">{job.deliveryCountry}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Move Date */}
          {job.estimatedDeliveryDetails && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-100 shadow-lg">
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center mr-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-600 mb-1">Scheduled Move Date</h4>
                  <p className="text-3xl font-bold text-purple-900">{job.estimatedDeliveryDetails}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Job Summary */}
        {job.jobValue && (
          <div className="max-w-7xl mx-auto px-8 py-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Quote Summary</h3>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-10">
              <div className="grid md:grid-cols-3 gap-10">
                <div className="text-center relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="pt-8">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Total Volume</p>
                    <p className="text-4xl font-bold text-blue-900 mb-1">{totalCube.toFixed(2)}</p>
                    <p className="text-lg text-gray-600">cubic meters</p>
                  </div>
                </div>
                <div className="text-center relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div className="pt-8">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Total Items</p>
                    <p className="text-4xl font-bold text-purple-900 mb-1">{inventory.length}</p>
                    <p className="text-lg text-gray-600">pieces</p>
                  </div>
                </div>
                <div className="text-center relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="pt-8">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Estimated Cost</p>
                    <p className="text-4xl font-bold text-green-600 mb-1">${job.jobValue.toFixed(2)}</p>
                    <p className="text-lg text-gray-600">AUD inc. GST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Section */}
        {inventory.length > 0 && (
          <div className="max-w-7xl mx-auto px-8 py-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Complete Inventory</h3>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-5">
                <div className="grid grid-cols-12 gap-6 font-semibold text-sm uppercase tracking-wider">
                  <div className="col-span-6">Item Description</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Volume (m³)</div>
                  <div className="col-span-2 text-center">Category</div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {inventory.map((item, index) => (
                  <div key={item.id} className="px-8 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                    <div className="grid grid-cols-12 gap-6 items-center">
                      <div className="col-span-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mr-4 flex-shrink-0">
                            <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{item.description}</p>
                            {item.room && <p className="text-sm text-gray-500 mt-1">Room: {item.room}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 text-lg font-bold text-purple-900">
                          {item.quantity || 1}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-lg font-semibold text-gray-900">{item.cube?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="inline-block px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                          {item.typeCode || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-8 py-6 border-t-2 border-gray-300">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-6 flex items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-600 text-xl font-bold text-white shadow-lg">
                      {inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xl font-bold text-gray-900">{totalCube.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Next Steps</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-lg">
                  1
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Review Your Quote</h4>
                <p className="text-gray-600 leading-relaxed">Please review all details including the inventory list, services, and pricing carefully.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-lg">
                  2
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h4>
                <p className="text-gray-600 leading-relaxed">If you have any questions or need adjustments, our team is here to help.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-100 hover:border-green-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-lg">
                  3
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Confirm Booking</h4>
                <p className="text-gray-600 leading-relaxed">Once you're ready, confirm your booking to secure your preferred move date.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Terms */}
        <div className="bg-gradient-to-br from-gray-50 to-white mt-12 border-t-2 border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Terms & Conditions
              </h4>
              <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>This quote is valid for 30 days from the date of issue.</p>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>All prices are in Australian Dollars (AUD) and include GST.</p>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>Final pricing may vary based on actual inventory and conditions.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>Payment: 50% deposit to confirm, balance due on completion.</p>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>Cancellation: Full refund if cancelled 7+ days before move date.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-10 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl shadow-xl p-10 text-white">
              <div className="text-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={companyName}
                    className="h-16 w-auto object-contain mx-auto mb-6 brightness-0 invert"
                  />
                ) : (
                  <h3 className="text-3xl font-bold mb-6">{companyName}</h3>
                )}
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold mb-1">Email</p>
                    <p className="text-blue-100">contact@moveware.com</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <p className="font-semibold mb-1">Phone</p>
                    <p className="text-blue-100">1300 MOVEWARE</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <p className="font-semibold mb-1">Website</p>
                    <p className="text-blue-100">www.moveware.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
