'use client';

import { useEffect, useLayoutEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { Loader2, AlertCircle } from 'lucide-react';
import SignatureCanvas from '@/lib/components/forms/signature-canvas';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CustomLayoutRenderer } from '@/lib/components/quote/custom-layout-renderer';
import type { LayoutConfig } from '@/lib/services/llm-service';

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
    heroBannerUrl?: string;
    footerImageUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
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
  const shouldPrint = searchParams.get('print') === 'true';
  const acceptanceId = searchParams.get('acceptanceId');
  const isPreviewMode = searchParams.get('preview') === 'true';
  
  const [job, setJob] = useState<Job | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [costings, setCostings] = useState<CostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom layout state
  const [customLayout, setCustomLayout] = useState<LayoutConfig | null>(null);
  
  // Form state for signature section
  const [signatureName, setSignatureName] = useState('');
  const [reloFromDate, setReloFromDate] = useState<Date | null>(null);
  const [insuredValue, setInsuredValue] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [signature, setSignature] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDetailsIndex, setShowDetailsIndex] = useState<number | null>(null);
  const [selectedCostingId, setSelectedCostingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [animateSteps, setAnimateSteps] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  
  // Pagination state for inventory table
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Refs
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const nextStepsRef = useRef<HTMLDivElement>(null);

  // Derived from job branding — declared early so it's available in all effects below.
  // Safe to read before job loads because job may be null at that point (defaults apply).
  const primaryColor = job?.branding?.primaryColor || '#1E40AF';

  // ── Grace inventory pagination ────────────────────────────────────────────
  // Refs let the document-level click handler always see the latest values
  // without being recreated (avoids stale-closure bugs entirely).
  const inventoryLengthRef = useRef(inventory.length);
  const itemsPerPageRef    = useRef(itemsPerPage);
  useEffect(() => { inventoryLengthRef.current = inventory.length; }, [inventory.length]);
  useEffect(() => { itemsPerPageRef.current    = itemsPerPage;    }, [itemsPerPage]);

  // Single document-level click handler — set up ONCE, uses refs for current
  // values.  This is immune to dangerouslySetInnerHTML replacing the buttons
  // (which would destroy per-element listeners) and to stale-closure issues.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn    = target.closest<HTMLElement>('[data-pgdir],[data-pgnum]');
      if (!btn) return;
      const dir = btn.getAttribute('data-pgdir');
      const num = btn.getAttribute('data-pgnum');
      const total = itemsPerPageRef.current === -1
        ? 1
        : Math.ceil(inventoryLengthRef.current / itemsPerPageRef.current);
      if (dir === 'prev') setCurrentPage((p) => Math.max(1, p - 1));
      if (dir === 'next') setCurrentPage((p) => Math.min(total, p + 1));
      if (num !== null) setCurrentPage(Number(num));
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty — intentional; refs keep values current

  // Rebuild the Grace inventory pagination UI each time the relevant state
  // changes.  useLayoutEffect fires synchronously after React commits the DOM
  // (including dangerouslySetInnerHTML), so buttons are ready before paint.
  // Click handling is done by the document-level handler above.
  useLayoutEffect(() => {
    if (!customLayout) return;

    const color      = primaryColor || '#e53e3e';
    const totalItems = inventory.length;
    const pages      = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);
    const page       = currentPage;
    const from       = itemsPerPage === -1 ? 1 : (page - 1) * itemsPerPage + 1;
    const to         = itemsPerPage === -1 ? totalItems : Math.min(page * itemsPerPage, totalItems);

    const btnStyle = (disabled: boolean) => [
      'padding:6px 14px',
      'border-radius:6px',
      'font-size:13px',
      'font-weight:500',
      'cursor:' + (disabled ? 'not-allowed' : 'pointer'),
      'background:#fff',
      'border:1px solid ' + (disabled ? '#d1d5db' : color),
      'color:' + (disabled ? '#9ca3af' : color),
      'opacity:' + (disabled ? '0.6' : '1'),
    ].join(';');

    // Find the pagination container — supports both the current template
    // (id="grace-inventory-pagination") and old stored layout versions that
    // used different structures or no id.
    let paginationEl = document.getElementById('grace-inventory-pagination');
    if (!paginationEl) {
      const firstBtn = document.querySelector<HTMLElement>('[data-dir="prev"], .grace-page-btn');
      if (firstBtn) {
        let p: HTMLElement | null = firstBtn.parentElement;
        for (let i = 0; i < 5 && p; i++) {
          if (p.tagName === 'TABLE') break;
          const s = p.style;
          if (s.display === 'flex' && s.justifyContent && s.justifyContent !== '') {
            paginationEl = p; break;
          }
          p = p.parentElement;
        }
        if (!paginationEl) paginationEl = firstBtn.closest('div') || firstBtn.parentElement;
      }
    }
    if (!paginationEl) return;
    if (!paginationEl.id) paginationEl.id = 'grace-inventory-pagination';

    if (pages <= 1) {
      paginationEl.style.display = 'none';
      return;
    }

    paginationEl.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;' +
      'padding-top:16px;border-top:1px solid #e9e9e9;margin-top:4px;';

    const prevDisabled = page <= 1;
    const nextDisabled = page >= pages;

    const maxVisible = 5;
    const half       = Math.floor(maxVisible / 2);
    const startPage  = Math.max(1, Math.min(page - half, pages - maxVisible + 1));
    const endPage    = Math.min(pages, startPage + maxVisible - 1);

    let pageNumHtml = '';
    for (let pg = startPage; pg <= endPage; pg++) {
      const active = pg === page;
      pageNumHtml += `<button data-pgnum="${pg}" style="width:32px;height:32px;border-radius:50%;` +
        `font-size:13px;font-weight:${active ? 700 : 400};cursor:${active ? 'default' : 'pointer'};` +
        `display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;` +
        `border:1px solid ${active ? color : '#d1d5db'};background:${active ? color : '#fff'};` +
        `color:${active ? '#fff' : '#374151'};">${pg}</button>`;
    }

    paginationEl.innerHTML =
      `<span style="font-size:13px;color:#666;">Showing ${from} to ${to} of ${totalItems} items</span>` +
      `<div style="display:flex;gap:4px;align-items:center;">` +
      `<button data-pgdir="prev" ${prevDisabled ? 'disabled' : ''} style="${btnStyle(prevDisabled)}">Previous</button>` +
      `<div style="display:flex;gap:4px;align-items:center;margin:0 4px;">${pageNumHtml}</div>` +
      `<button data-pgdir="next" ${nextDisabled ? 'disabled' : ''} style="${btnStyle(nextDisabled)}">Next</button>` +
      `</div>`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customLayout, currentPage, itemsPerPage, inventory.length, primaryColor]);

  // ── Grace banner JS fallback ──────────────────────────────────────────────
  // The graceBannerCss <style> tag handles most cases via CSS, but runs as a
  // belt-and-braces DOM pass after React commits so that any stale inline
  // styles on the stored template HTML are overwritten with setProperty
  // ('important') — which has higher priority than stylesheet !important.
  // Targets elements by BOTH the .grace-hero-wrap class (current templates)
  // AND the [data-sid] wrapper's first div child (old templates without class).
  useLayoutEffect(() => {
    if (!customLayout) return;

    const heroSec = customLayout.sections?.find((s) => s.id === 'grace-hero');
    const footSec = customLayout.sections?.find((s) => s.id === 'grace-footer-image');
    if (!heroSec && !footSec) return;

    const hD = Number((heroSec?.config  as Record<string,unknown>)?.desktopMaxHeight || 500);
    const fD = Number((footSec?.config  as Record<string,unknown>)?.desktopMaxHeight || 500);

    const applyWrap = (el: HTMLElement, heightPx: number) => {
      el.style.setProperty('width',        '100vw',         'important');
      el.style.setProperty('position',     'relative',      'important');
      el.style.setProperty('left',         '50%',           'important');
      el.style.setProperty('right',        '50%',           'important');
      el.style.setProperty('margin-left',  '-50vw',         'important');
      el.style.setProperty('margin-right', '-50vw',         'important');
      el.style.setProperty('height',       `${heightPx}px`, 'important');
      el.style.setProperty('max-height',   'none',          'important');
      el.style.setProperty('overflow',     'hidden',        'important');
      el.style.setProperty('display',      'block',         'important');
      el.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        img.style.setProperty('position',        'absolute', 'important');
        img.style.setProperty('top',             '0',        'important');
        img.style.setProperty('left',            '0',        'important');
        img.style.setProperty('right',           '0',        'important');
        img.style.setProperty('bottom',          '0',        'important');
        img.style.setProperty('width',           '100%',     'important');
        img.style.setProperty('height',          '100%',     'important');
        img.style.setProperty('max-width',       'none',     'important');
        img.style.setProperty('object-fit',      'cover',    'important');
        img.style.setProperty('object-position', 'center',   'important');
        img.style.setProperty('display',         'block',    'important');
      });
    };

    // Strategy 1: class-based (current / recent stored templates)
    document.querySelectorAll<HTMLElement>('.grace-hero-wrap').forEach(
      (el) => applyWrap(el, hD),
    );
    document.querySelectorAll<HTMLElement>('.grace-footer-wrap').forEach(
      (el) => applyWrap(el, fD),
    );

    // Strategy 2: data-sid-based first-child div (old templates without class)
    const heroWrapper = document.querySelector<HTMLElement>('[data-sid="grace-hero"]');
    if (heroWrapper) {
      const firstDiv = heroWrapper.querySelector<HTMLElement>(':scope > div');
      if (firstDiv) applyWrap(firstDiv, hD);
    }
    const footWrapper = document.querySelector<HTMLElement>('[data-sid="grace-footer-image"]');
    if (footWrapper) {
      const firstDiv = footWrapper.querySelector<HTMLElement>(':scope > div');
      if (firstDiv) applyWrap(firstDiv, fD);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customLayout]);

  // Validation states
  const [errors, setErrors] = useState({
    signatureName: '',
    reloFromDate: '',
    insuredValue: '',
    purchaseOrderNumber: '',
    signature: '',
    selectedCosting: '',
  });

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for steps animation - only set up after content loads
  useEffect(() => {
    if (loading || !job || customLayout) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('Next Steps Intersection:', entry.isIntersecting, entry.intersectionRatio);
          if (entry.isIntersecting) {
            console.log('Setting animateSteps to true');
            setAnimateSteps(true);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -50px 0px' }
    );

    // Small delay to ensure DOM is ready after loading completes
    const timer = setTimeout(() => {
      const stepsSection = nextStepsRef.current;
      if (stepsSection) {
        console.log('Observing steps section:', stepsSection);
        observer.observe(stepsSection);
      } else {
        console.log('Steps section ref not found');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (nextStepsRef.current) {
        observer.unobserve(nextStepsRef.current);
      }
    };
  }, [loading, job, customLayout]);

  useEffect(() => {
    if (jobId && companyId) {
      fetchJobData(jobId, companyId);
      
      // If acceptanceId is provided, fetch and populate form data
      if (acceptanceId) {
        fetchAcceptanceData(acceptanceId);
      }
    } else {
      setError('Missing required parameters: jobId and coId are required');
      setLoading(false);
    }
  }, [jobId, companyId, acceptanceId]);

  // Auto-generate PDF if print parameter is present (only once)
  useEffect(() => {
    if (shouldPrint && !loading && job && !pdfGenerated) {
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        generatePDF();
        setPdfGenerated(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, loading, job, pdfGenerated]);

  // Auto-select if there's only one costing option
  useEffect(() => {
    if (costings.length === 1 && !selectedCostingId) {
      setSelectedCostingId(costings[0].id);
    }
  }, [costings, selectedCostingId]);

  // Wire up grace pricing "Select Option" / "✓ Selected" buttons.
  // Re-runs after each render so button state always reflects selectedCostingId.
  useEffect(() => {
    if (!customLayout) return;
    const timer = setTimeout(() => {
      const buttons = document.querySelectorAll<HTMLButtonElement>('.grace-select-btn');
      buttons.forEach((btn) => {
        const fresh = btn.cloneNode(true) as HTMLButtonElement;
        btn.parentNode?.replaceChild(fresh, btn);

        const costingId = fresh.dataset.costingId;
        const isSelected = costingId === selectedCostingId;

        fresh.textContent = isSelected ? '✓ Selected' : 'Select Option';
        fresh.style.opacity = isSelected ? '0.85' : '1';
        fresh.style.outline = isSelected ? '3px solid rgba(255,255,255,0.6)' : 'none';

        fresh.addEventListener('click', () => {
          if (costingId) setSelectedCostingId(costingId);
        });
      });
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customLayout, selectedCostingId]);

  // Reset to page 1 when inventory changes
  useEffect(() => {
    setCurrentPage(1);
  }, [inventory.length]);

  // Listen for layout preview updates via postMessage (from layout builder iframe)
  useEffect(() => {
    if (!isPreviewMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LAYOUT_PREVIEW_UPDATE' && event.data.config) {
        console.log('[Quote Preview] Received layout config via postMessage');
        setCustomLayout(event.data.config);
      }
    };

    window.addEventListener('message', handleMessage);

    // Signal to parent that we are ready to receive layout configs
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'LAYOUT_PREVIEW_READY' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [isPreviewMode]);

  // Google Font injection - must run unconditionally (before any early return) to avoid React hooks order error #310
  const fontFamilyForLink = job?.branding?.fontFamily || 'Inter';
  const systemFontsList = ['Arial', 'Georgia', 'system-ui'];
  const googleFontHref =
    fontFamilyForLink && !systemFontsList.includes(fontFamilyForLink)
      ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamilyForLink).replace(/%20/g, '+')}:wght@400;600;700&display=swap`
      : null;
  useEffect(() => {
    if (!googleFontHref) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontHref;
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [googleFontHref]);

  const fetchAcceptanceData = async (acceptanceIdParam: string) => {
    try {
      const response = await fetch(`/api/quotes/acceptance/${acceptanceIdParam}`);
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const acceptance = result.data;
        // Populate form fields with accepted data
        setSignatureName(acceptance.signatureName);
        setReloFromDate(acceptance.reloFromDate ? new Date(acceptance.reloFromDate.split('/').reverse().join('-')) : null);
        setInsuredValue(acceptance.insuredValue);
        setPurchaseOrderNumber(acceptance.purchaseOrderNumber);
        setSpecialRequirements(acceptance.specialRequirements || '');
        setSignature(acceptance.signatureData);
        setSelectedCostingId(acceptance.costingItemId);
        setAgreedToTerms(acceptance.agreedToTerms);
      }
    } catch (err) {
      console.error('Error fetching acceptance data:', err);
    }
  };

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

      // Always load the saved layout from the API.
      // In preview mode (Layout Builder iframe) the postMessage handler will
      // override this with the latest in-editor config after it arrives.
      try {
        const layoutRes = await fetch(`/api/layouts/${coIdParam}`);
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();
          if (layoutData.success && layoutData.data?.layoutConfig && layoutData.data?.isActive) {
            setCustomLayout(layoutData.data.layoutConfig);
          }
        }
      } catch {
        // No custom layout — use base layout
      }
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

  // Derive which acceptance form fields are visible from the layout config.
  // When there is no custom layout (base template) all fields are shown by default.
  const acceptanceCfg = (() => {
    if (!customLayout) return {} as Record<string, unknown>;
    const sec = customLayout.sections?.find((s) => s.component === 'AcceptanceForm');
    return ((sec as { config?: Record<string, unknown> })?.config || {}) as Record<string, unknown>;
  })();
  const acShowSignatureName        = acceptanceCfg.showSignatureName        !== false;
  const acShowReloFromDate         = acceptanceCfg.showReloFromDate         !== false;
  const acShowInsuredValue         = acceptanceCfg.showInsuredValue         !== false;
  const acShowPurchaseOrderNumber  = acceptanceCfg.showPurchaseOrderNumber  !== false;
  const acShowSpecialRequirements  = acceptanceCfg.showSpecialRequirements  !== false;

  const validateForm = () => {
    const newErrors = {
      signatureName: '',
      reloFromDate: '',
      insuredValue: '',
      purchaseOrderNumber: '',
      signature: '',
      selectedCosting: '',
    };

    if (acShowSignatureName && !signatureName.trim()) {
      newErrors.signatureName = 'Signature name is required';
    }
    if (acShowReloFromDate && !reloFromDate) {
      newErrors.reloFromDate = 'Move date is required';
    }
    if (acShowInsuredValue && !insuredValue.trim()) {
      newErrors.insuredValue = 'Insured value is required';
    }
    if (acShowPurchaseOrderNumber && !purchaseOrderNumber.trim()) {
      newErrors.purchaseOrderNumber = 'Purchase order number is required';
    }
    if (!signature) {
      newErrors.signature = 'Signature is required';
    }
    if (!selectedCostingId) {
      newErrors.selectedCosting = 'Please select a pricing option';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const isFormValid = () => {
    return (!acShowSignatureName       || signatureName.trim()) &&
           (!acShowReloFromDate        || reloFromDate) &&
           (!acShowInsuredValue        || insuredValue.trim()) &&
           (!acShowPurchaseOrderNumber || purchaseOrderNumber.trim()) &&
           signature &&
           selectedCostingId &&
           agreedToTerms;
  };

  const generatePDF = async () => {
    if (!pdfContentRef.current || !job) return;

    // Save current pagination settings
    const previousItemsPerPage = itemsPerPage;
    
    try {
      setGeneratingPdf(true);

      // Temporarily show all items for PDF generation
      setItemsPerPage(-1);
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      const customerName = `${job.titleName || ''} ${job.firstName || ''} ${job.lastName || ''}`.trim();
      const companyName = job.branding?.companyName || 'MOVEWARE';
      
      // PDF options
      const opt = {
        margin: 10,
        filename: `Quote-${job.id}-${customerName.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      // Generate PDF from the content
      await html2pdf().set(opt).from(pdfContentRef.current).save();
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      // Restore previous pagination settings
      setItemsPerPage(previousItemsPerPage);
      setGeneratingPdf(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!validateForm()) {
      return;
    }

    if (!agreedToTerms) {
      return;
    }


    try {
      setSubmitting(true);
      
      // Format date as DD/MM/YYYY
      const formattedDate = reloFromDate ? formatDate(reloFromDate) : '';
      
      const response = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          quoteNumber: jobId,          // API field alias — both are accepted
          costingItemId: selectedCostingId,
          signatureName: signatureName || customerName,   // fallback when field is hidden
          customerName,
          reloFromDate: formattedDate,
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

      // Store acceptance ID in sessionStorage for PDF generation
      if (result.data?.id) {
        sessionStorage.setItem('quoteAcceptanceId', result.data.id);
      }

      // Show success message inline
      setError(null);
      // Redirect to thank you page with parameters
      window.location.href = `/thank-you?jobId=${jobId}&coId=${companyId}`;
    } catch (err) {
      console.error('Error accepting quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept quote. Please try again.');
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
  const heroBannerUrl = job.branding?.heroBannerUrl;
  const footerImageUrl = job.branding?.footerImageUrl;
  const fontFamily = job.branding?.fontFamily || 'Inter';
  const totalCube = inventory.reduce((sum, item) => sum + (item.cube || 0), 0);

  // ── Date formatting helpers ────────────────────────────────────────────────
  const WEEKDAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /** DD/MM/YYYY */
  const formatDateShort = (d: Date) =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  /** Wednesday, February 18, 2026 */
  const formatDateLongUS = (d: Date) =>
    `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  /** Wednesday, 18 February 2026 */
  const formatDateLongAU = (d: Date) =>
    `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;

  /** 18 Feb 2026 */
  const formatDateMedium = (d: Date) =>
    `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

  const now    = new Date();
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const quoteDate        = formatDateShort(now);
  const quoteDateLong    = formatDateLongUS(now);
  const quoteDateFull    = formatDateLongAU(now);
  const quoteDateMedium  = formatDateMedium(now);
  const expiryDate       = formatDateShort(expiry);
  const expiryDateLong   = formatDateLongUS(expiry);
  const expiryDateFull   = formatDateLongAU(expiry);
  const expiryDateMedium = formatDateMedium(expiry);

  // Keep the old name for any code that still calls formatDate directly
  const formatDate = formatDateShort;

  // Pagination logic for inventory
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(inventory.length / itemsPerPage);
  const paginatedInventory = itemsPerPage === -1 
    ? inventory 
    : inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // ---- Custom Layout Rendering ----
  if (customLayout) {
    // globalStyles from the layout config take priority — this lets the Layout Builder
    // push live image/font updates via postMessage without a DB round-trip
    const gs = (customLayout.globalStyles || {}) as Record<string, string>;

    // Pagination metadata for the inventory table in the custom layout
    const invFrom = inventory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const invTo = Math.min(currentPage * itemsPerPage, inventory.length);
    const invTotalPages = totalPages;

    const pageData = {
      job,
      inventory: paginatedInventory,   // pass current page only
      costings,
      customerName,
      companyName,
      logoUrl: gs.logoUrl || logoUrl,
      heroBannerUrl: gs.heroBannerUrl || heroBannerUrl,
      footerImageUrl: gs.footerImageUrl || footerImageUrl,
      primaryColor,
      quoteDate,
      quoteDateLong,
      quoteDateFull,
      quoteDateMedium,
      expiryDate,
      expiryDateLong,
      expiryDateFull,
      expiryDateMedium,
      totalCube,
      // Inventory pagination fields (resolved as {{inventoryFrom}} etc. in templates)
      inventoryFrom: invFrom,
      inventoryTo: invTo,
      inventoryTotal: inventory.length,
      inventoryCurrentPage: currentPage,
      inventoryTotalPages: invTotalPages,
    };

    // ── Acceptance form rendered as a React slot ──────────────────────────────
    // This replaces the old custom HTML acceptance block so that SignatureCanvas,
    // DatePicker and all form state work exactly as in the default template.
    // It is styled to match the grace card pattern used by all other blocks.
    const acceptanceFormSlot = (
      <div style={{ marginBottom: '50px', background: '#ffffff', border: '1px solid #e9e9e9', borderRadius: '20px', padding: '28px 24px' }}>
          <h3 style={{ color: primaryColor, fontSize: '22px', fontWeight: 700, margin: '0 0 16px 0', paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
            Accept quote
          </h3>

          <p style={{ fontSize: '13px', color: '#777', lineHeight: '1.7', margin: '0 0 20px 0' }}>
            Please review the details of this proposal carefully before accepting. By accepting the quote you acknowledge and agree to the terms and conditions outlined in this proposal.
          </p>

          {/* Validation error */}
          {errors.selectedCosting && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {errors.selectedCosting}
            </div>
          )}

          {/* Form fields — visibility driven by acceptanceCfg */}
          {(acShowSignatureName || acShowReloFromDate || acShowInsuredValue || acShowPurchaseOrderNumber || acShowSpecialRequirements) && (
            <div className="space-y-4 mb-6">
              {(acShowSignatureName || acShowReloFromDate) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {acShowSignatureName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Signature Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={signatureName}
                        onChange={(e) => { setSignatureName(e.target.value); if (errors.signatureName) setErrors({ ...errors, signatureName: '' }); }}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${errors.signatureName ? 'border-red-500' : 'border-gray-300'}`}
                        style={{ outlineColor: primaryColor }}
                      />
                      {errors.signatureName && <p className="mt-1 text-sm text-red-600">{errors.signatureName}</p>}
                    </div>
                  )}
                  {acShowReloFromDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relo From date: DD/MM/YYYY <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        selected={reloFromDate}
                        onChange={(date: Date | null) => { setReloFromDate(date); if (errors.reloFromDate) setErrors({ ...errors, reloFromDate: '' }); }}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select move date"
                        minDate={new Date()}
                        showPopperArrow={false}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={15}
                        scrollableYearDropdown
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${errors.reloFromDate ? 'border-red-500' : 'border-gray-300'}`}
                        wrapperClassName="w-full"
                      />
                      {errors.reloFromDate && <p className="mt-1 text-sm text-red-600">{errors.reloFromDate}</p>}
                    </div>
                  )}
                </div>
              )}
              {(acShowInsuredValue || acShowPurchaseOrderNumber) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {acShowInsuredValue && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insured value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={insuredValue}
                        onChange={(e) => { setInsuredValue(e.target.value); if (errors.insuredValue) setErrors({ ...errors, insuredValue: '' }); }}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${errors.insuredValue ? 'border-red-500' : 'border-gray-300'}`}
                        style={{ outlineColor: primaryColor }}
                      />
                      {errors.insuredValue && <p className="mt-1 text-sm text-red-600">{errors.insuredValue}</p>}
                    </div>
                  )}
                  {acShowPurchaseOrderNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase order number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={purchaseOrderNumber}
                        onChange={(e) => { setPurchaseOrderNumber(e.target.value); if (errors.purchaseOrderNumber) setErrors({ ...errors, purchaseOrderNumber: '' }); }}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${errors.purchaseOrderNumber ? 'border-red-500' : 'border-gray-300'}`}
                        style={{ outlineColor: primaryColor }}
                      />
                      {errors.purchaseOrderNumber && <p className="mt-1 text-sm text-red-600">{errors.purchaseOrderNumber}</p>}
                    </div>
                  )}
                </div>
              )}
              {acShowSpecialRequirements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add any special requirements here
                  </label>
                  <textarea
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: primaryColor }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Signature Canvas */}
          <div className="mb-6">
            <SignatureCanvas
              value={signature}
              onChange={(sig) => { setSignature(sig); if (errors.signature) setErrors({ ...errors, signature: '' }); }}
              error={errors.signature}
            />
            {errors.signature && <p className="mt-1 text-sm text-red-600">{errors.signature}</p>}
          </div>

          {/* Terms & Conditions */}
          <div className="mb-6">
            <a href="#" className="hover:underline text-sm inline-flex items-center gap-1 mb-3" style={{ color: primaryColor }}>
              Read Terms &amp; Conditions here
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
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm text-gray-700">I have read and agree to your Terms &amp; Conditions</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 no-print">
            <button className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors">
              Decline
            </button>
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              style={{ backgroundColor: generatingPdf ? '#e5e7eb' : primaryColor }}
              className="flex-1 px-6 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generatingPdf ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Print / Save PDF
                </>
              )}
            </button>
            <button
              onClick={handleAcceptQuote}
              disabled={!isFormValid() || submitting}
              style={{ backgroundColor: isFormValid() && !submitting ? primaryColor : '#e5e7eb' }}
              className="flex-1 px-6 py-3 text-white font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Accept'}
            </button>
          </div>
        </div>
    );

    return (
      <PageShell includeHeader={false}>
        <div ref={pdfContentRef}>
          <CustomLayoutRenderer
            config={customLayout}
            data={pageData}
            selectedCostingId={selectedCostingId}
            onSelectCosting={(id: string) => setSelectedCostingId(id)}
            acceptanceFormSlot={acceptanceFormSlot}
          />
        </div>
        {/* Back to Top — desktop & tablet only */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="no-print fixed bottom-8 right-8 w-12 h-12 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 hidden md:flex items-center justify-center z-50 hover:scale-110"
            style={{ backgroundColor: primaryColor }}
            aria-label="Back to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </PageShell>
    );
  }

  // ---- Base Layout Rendering ----
  return (
    <PageShell includeHeader={false}>
      <div
        ref={pdfContentRef}
        className="min-h-screen bg-gray-50"
        style={{ fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined }}
      >
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
          
          {/* Introduction Section */}
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Quotation Number: {job.id}
            </h3>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Dear {job.titleName} {job.lastName},</p>
              
              <p>
                Thank you for contacting us for your upcoming move. Below you will find our pricing, 
                tailored to meet your specific moving requirements.
              </p>
              
              <p>
                Please note this quotation is valid for 28 days from the quotation date.
              </p>
              
              <p>
                To confirm a booking with us, simply select the pricing option that you prefer and 
                accept after filling in all information we need. And of course, should you have any 
                questions about this quote, please do not hesitate to contact us.
              </p>
              
              <p>We look forward to being at your service.</p>
              
              <p className="font-semibold mt-6">
                {companyName} Admin
              </p>
            </div>
          </div>
          
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
                    onClick={() => {
                      setSelectedCostingId(costing.id);
                      if (errors.selectedCosting) {
                        setErrors({ ...errors, selectedCosting: '' });
                      }
                    }}
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
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Complete Inventory</h3>
                <div className="no-print flex items-center gap-3">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    style={{ 
                      outlineColor: primaryColor,
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:border-transparent transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={-1}>All</option>
                  </select>
                  <span className="text-sm text-gray-600">items per page</span>
                </div>
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
                    {paginatedInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.description}</div>
                          {item.room && <div className="text-xs text-gray-500">Room: {item.room}</div>}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{item.quantity || 1}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{item.cube?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 text-center">
                          <span 
                            className="inline-block px-2 py-1 text-xs font-medium rounded"
                            style={{ 
                              backgroundColor: `${primaryColor}15`,
                              color: primaryColor 
                            }}
                          >
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
                        <span className="text-red-600">Qty</span> {inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                        <span className="text-red-600">cubic metres</span> {totalCube.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {itemsPerPage !== -1 && totalPages > 1 && (
                <div className="no-print px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, inventory.length)} of {inventory.length} items
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        borderColor: currentPage === 1 ? '#d1d5db' : primaryColor,
                        color: currentPage === 1 ? '#9ca3af' : primaryColor,
                      }}
                      className="px-3 py-1 border rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-80"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return page === 1 || 
                                 page === totalPages || 
                                 (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          
                          return (
                            <div key={page} className="flex gap-1">
                              {showEllipsis && (
                                <span className="px-3 py-1 text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                style={
                                  currentPage === page
                                    ? {
                                        backgroundColor: primaryColor,
                                        borderColor: primaryColor,
                                        color: 'white',
                                      }
                                    : {
                                        borderColor: '#d1d5db',
                                        color: '#374151',
                                      }
                                }
                                className={`px-3 py-1 border rounded text-sm transition-all ${
                                  currentPage === page
                                    ? 'font-bold shadow-md'
                                    : 'hover:opacity-70'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        borderColor: currentPage === totalPages ? '#d1d5db' : primaryColor,
                        color: currentPage === totalPages ? '#9ca3af' : primaryColor,
                      }}
                      className="px-3 py-1 border rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-80"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Steps Section */}
          <div ref={nextStepsRef} className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
            
            <style jsx global>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes drawLine {
                from {
                  width: 0;
                }
                to {
                  width: 100%;
                }
              }

              .step-1.animate {
                animation: fadeInUp 0.6s ease-out 0.2s both;
              }

              .line-1.animate {
                animation: drawLine 0.8s ease-out 0.8s both;
              }

              .step-2.animate {
                animation: fadeInUp 0.6s ease-out 1.6s both;
              }

              .line-2.animate {
                animation: drawLine 0.8s ease-out 2.2s both;
              }

              .step-3.animate {
                animation: fadeInUp 0.6s ease-out 3s both;
              }

              .step-1:not(.animate),
              .step-2:not(.animate),
              .step-3:not(.animate) {
                opacity: 0;
              }

              .line-1:not(.animate),
              .line-2:not(.animate) {
                width: 0;
              }

              /* Custom DatePicker Styling */
              .react-datepicker {
                font-family: inherit;
                border: 2px solid #e5e7eb;
                border-radius: 0.75rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                overflow: hidden;
              }

              .react-datepicker__header {
                background-color: ${primaryColor};
                border-bottom: none;
                border-radius: 0;
                padding: 1.25rem 0.75rem 0.75rem;
              }

              .react-datepicker__current-month {
                color: white;
                font-weight: 700;
                font-size: 1.125rem;
                margin-bottom: 0.5rem;
              }

              .react-datepicker__day-name {
                color: white;
                font-weight: 600;
                font-size: 0.875rem;
                width: 2.5rem;
                line-height: 2.5rem;
                margin: 0.166rem;
              }

              .react-datepicker__day {
                border-radius: 0.5rem;
                transition: all 0.2s;
                width: 2.5rem;
                line-height: 2.5rem;
                margin: 0.166rem;
                font-size: 0.9rem;
                color: #374151;
              }

              .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
                background-color: ${primaryColor}15;
                color: ${primaryColor};
                font-weight: 600;
              }

              .react-datepicker__day--selected,
              .react-datepicker__day--keyboard-selected {
                background-color: ${primaryColor} !important;
                color: white !important;
                font-weight: 700 !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }

              .react-datepicker__day--today {
                font-weight: 700;
                color: ${primaryColor};
                background-color: ${primaryColor}10;
                border: 2px solid ${primaryColor};
              }

              .react-datepicker__day--today.react-datepicker__day--selected {
                color: white !important;
                background-color: ${primaryColor} !important;
                border-color: transparent;
              }

              .react-datepicker__day--disabled {
                color: #d1d5db !important;
                cursor: not-allowed;
              }

              .react-datepicker__navigation {
                top: 1.25rem;
                width: 2rem;
                height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0.375rem;
                transition: background-color 0.2s;
              }

              .react-datepicker__navigation:hover {
                background-color: rgba(255, 255, 255, 0.2);
              }

              .react-datepicker__navigation-icon::before {
                border-color: white;
                border-width: 2px 2px 0 0;
                width: 8px;
                height: 8px;
                top: 50%;
              }

              .react-datepicker__navigation--previous {
                left: 0.75rem;
              }

              .react-datepicker__navigation--previous .react-datepicker__navigation-icon::before {
                transform: translateY(-50%) rotate(-135deg);
                left: 50%;
                margin-left: 2px;
              }

              .react-datepicker__navigation--next {
                right: 0.75rem;
              }

              .react-datepicker__navigation--next .react-datepicker__navigation-icon::before {
                transform: translateY(-50%) rotate(45deg);
                right: 50%;
                margin-right: 2px;
              }

              .react-datepicker__month-container {
                padding: 0.5rem;
              }

              .react-datepicker__month {
                margin: 0.5rem;
              }

              .react-datepicker__header__dropdown {
                display: flex;
                gap: 0.5rem;
                justify-content: center;
                padding: 0.5rem 0;
              }

              .react-datepicker__month-dropdown-container,
              .react-datepicker__year-dropdown-container {
                margin: 0;
              }

              .react-datepicker__month-select,
              .react-datepicker__year-select {
                background-color: white;
                color: ${primaryColor};
                border: 2px solid white;
                border-radius: 0.375rem;
                padding: 0.375rem 0.5rem;
                font-weight: 600;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s;
              }

              .react-datepicker__month-select:hover,
              .react-datepicker__year-select:hover {
                background-color: ${primaryColor}10;
                border-color: white;
              }

              .react-datepicker__month-select:focus,
              .react-datepicker__year-select:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
              }

              .react-datepicker__triangle {
                display: none;
              }
            `}</style>
            
            {/* Horizontal Steps Indicator */}
            <div className="flex items-start justify-between mb-6 relative">
              {/* Step 1 */}
              <div className={`text-center flex-1 step-1 ${animateSteps ? 'animate' : ''}`}>
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 relative z-10" style={{ backgroundColor: primaryColor }}>
                  1
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Review Your Quote</h4>
                <p className="text-sm text-gray-600">Please review all details including the inventory list, services, and pricing.</p>
              </div>

              {/* Line 1 to 2 */}
              <div className="flex items-center justify-center" style={{ width: '100px', marginTop: '24px' }}>
                <div className={`h-1 line-1 ${animateSteps ? 'animate' : ''}`} style={{ backgroundColor: primaryColor, width: 0 }}></div>
              </div>

              {/* Step 2 */}
              <div className={`text-center flex-1 step-2 ${animateSteps ? 'animate' : ''}`}>
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 relative z-10" style={{ backgroundColor: primaryColor }}>
                  2
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Contact Us</h4>
                <p className="text-sm text-gray-600">If you have any questions or need adjustments, our team is here to help.</p>
              </div>

              {/* Line 2 to 3 */}
              <div className="flex items-center justify-center" style={{ width: '100px', marginTop: '24px' }}>
                <div className={`h-1 line-2 ${animateSteps ? 'animate' : ''}`} style={{ backgroundColor: primaryColor, width: 0 }}></div>
              </div>

              {/* Step 3 */}
              <div className={`text-center flex-1 step-3 ${animateSteps ? 'animate' : ''}`}>
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 relative z-10" style={{ backgroundColor: primaryColor }}>
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

            {/* Validation Error Message */}
            {errors.selectedCosting && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {errors.selectedCosting}
              </div>
            )}

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
                    onChange={(e) => {
                      setSignatureName(e.target.value);
                      if (errors.signatureName) {
                        setErrors({ ...errors, signatureName: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${
                      errors.signatureName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ outlineColor: primaryColor }}
                  />
                  {errors.signatureName && (
                    <p className="mt-1 text-sm text-red-600">{errors.signatureName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relo From date: DD/MM/YYYY <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={reloFromDate}
                    onChange={(date: Date | null) => {
                      setReloFromDate(date);
                      if (errors.reloFromDate) {
                        setErrors({ ...errors, reloFromDate: '' });
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select move date"
                    minDate={new Date()}
                    showPopperArrow={false}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={15}
                    scrollableYearDropdown
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${
                      errors.reloFromDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    calendarClassName="custom-calendar"
                    wrapperClassName="w-full"
                  />
                  {errors.reloFromDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.reloFromDate}</p>
                  )}
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
                    onChange={(e) => {
                      setInsuredValue(e.target.value);
                      if (errors.insuredValue) {
                        setErrors({ ...errors, insuredValue: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${
                      errors.insuredValue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ outlineColor: primaryColor }}
                  />
                  {errors.insuredValue && (
                    <p className="mt-1 text-sm text-red-600">{errors.insuredValue}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase order number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseOrderNumber}
                    onChange={(e) => {
                      setPurchaseOrderNumber(e.target.value);
                      if (errors.purchaseOrderNumber) {
                        setErrors({ ...errors, purchaseOrderNumber: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:border-transparent ${
                      errors.purchaseOrderNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ outlineColor: primaryColor }}
                  />
                  {errors.purchaseOrderNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.purchaseOrderNumber}</p>
                  )}
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
                onChange={(sig) => {
                  setSignature(sig);
                  if (errors.signature) {
                    setErrors({ ...errors, signature: '' });
                  }
                }}
                error={errors.signature}
              />
              {errors.signature && (
                <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
              )}
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
            <div className="flex gap-4 no-print">
              <button className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors">
                Decline
              </button>
              <button 
                onClick={generatePDF}
                disabled={generatingPdf}
                style={{ backgroundColor: generatingPdf ? '#e5e7eb' : primaryColor }}
                className="flex-1 px-6 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  'Create PDF'
                )}
              </button>
              <button 
                onClick={handleAcceptQuote}
                disabled={!isFormValid() || submitting}
                style={{ backgroundColor: isFormValid() && !submitting ? primaryColor : '#e5e7eb' }}
                className="flex-1 px-6 py-3 text-white font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="no-print fixed bottom-8 right-8 w-12 h-12 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
            style={{ backgroundColor: primaryColor }}
            aria-label="Back to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
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
