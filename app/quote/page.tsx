import { Suspense } from 'react';
import { FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { QuoteForm } from '@/lib/components/forms';
import { heroService, brandingService, copyService } from '@/lib/services';
import type { HeroContent, BrandingContent, CopyContent } from '@/lib/services';

// Loading component for suspense fallback
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="h-12 bg-blue-700 rounded-lg w-2/3 mb-6"></div>
          <div className="h-6 bg-blue-700 rounded-lg w-1/2 mb-8"></div>
          <div className="h-12 bg-blue-700 rounded-lg w-32"></div>
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-8 animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

// Error component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
          <FileText className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Unable to Load Page</h2>
        <p className="text-gray-600 text-center">{message}</p>
      </div>
    </div>
  );
}

function getBrandingString(branding: BrandingContent | null, key: string): string | null {
  if (!branding) return null;
  const value = (branding as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

// Main quote page content component
async function QuotePageContent() {
  let hero: HeroContent | null = null;
  let branding: BrandingContent | null = null;
  let copyData: CopyContent | null = null;

  try {
    // Fetch all data in parallel
    const [heroData, brandingData, singleCopy] = await Promise.all([
      heroService.getHero().catch(() => null),
      brandingService.getBranding().catch(() => null),
      copyService.getCopy().catch(() => null),
    ]);

    hero = heroData;
    branding = brandingData;
    copyData = singleCopy;
  } catch (error) {
    console.error('Error fetching quote page data:', error);
    return <ErrorDisplay message="We couldn't load the quote page. Please try again later." />;
  }

  // Set default values if data is not available
  const heroTitle = hero?.heading || 'Get Your Moving Quote Today';
  const heroSubtitle =
    hero?.subheading ||
    'Professional moving services tailored to your needs. Fast, reliable, and affordable.';
  const heroCtaText = hero?.ctaText || 'Get Started';
  const heroCtaLink = hero?.ctaUrl || '#quote-form';

  const brandingName =
    getBrandingString(branding, 'companyName') ||
    getBrandingString(branding, 'name') ||
    'Moveware';
  const brandingTagline =
    getBrandingString(branding, 'tagline') || 'Your trusted moving partner';

  const primaryColor = branding?.primaryColor || '#2563eb';
  const secondaryColor = branding?.secondaryColor || '#1e40af';
  const description =
    copyData?.description ||
    'Complete your quote request in minutes. Our specialists will review your details and provide a detailed quote within one business day.';

  const benefits = [
    {
      title: 'Transparent Pricing',
      description: 'No hidden fees. We provide clear, upfront pricing for every move.',
      icon: CheckCircle,
    },
    {
      title: 'Quick Turnaround',
      description: 'Receive a custom quote within 24 hours of your submission.',
      icon: Clock,
    },
    {
      title: 'Dedicated Support',
      description: 'Our team is here to answer your questions at every step.',
      icon: FileText,
    },
  ];

  const steps = [
    {
      title: 'Share your move details',
      description: 'Tell us about your pickup and delivery locations, dates, and property type.',
    },
    {
      title: 'Get a tailored quote',
      description: 'Our team reviews your request and crafts a quote that fits your needs.',
    },
    {
      title: 'Schedule with confidence',
      description: 'Finalize your move with clear timelines and dedicated support.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Branding Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">{brandingName}</span>
              {brandingTagline && (
                <>
                  <span className="text-blue-200">•</span>
                  <span className="text-sm text-blue-100">{brandingTagline}</span>
                </>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {heroTitle}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={heroCtaLink}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 inline-flex items-center justify-center"
              >
                {heroCtaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                href="#quote-form"
                className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg border-2 border-blue-400 transition-all duration-200 inline-flex items-center justify-center"
              >
                Start Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              A streamlined moving quote experience
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="bg-white py-16 sm:py-20 lg:py-24 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                How it works
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Our process keeps things simple so you can focus on your move.
              </p>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need help getting started?
              </h3>
              <p className="text-gray-600 mb-6">
                Our team is ready to assist with special requests, large moves, or questions about your quote.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Dedicated move coordinator</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Flexible scheduling options</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Full insurance coverage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Form Section */}
      <section id="quote-form" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Request your quote
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Provide a few details about your move and we&apos;ll craft a personalized quote.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Accurate estimates</h4>
                    <p className="text-gray-600">We review every detail to give you a realistic quote.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Fast response</h4>
                    <p className="text-gray-600">Expect a response within one business day.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <QuoteForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <QuotePageContent />
    </Suspense>
  );
}
