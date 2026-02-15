'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { Loader2, Star, Send, CheckCircle } from 'lucide-react';

interface HeroSettings {
  id: string;
  companyId: string;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor: string;
  textColor: string;
  showLogo: boolean;
  alignment: 'left' | 'center' | 'right';
  updatedAt: string;
}

interface BrandingSettings {
  id: string;
  companyId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  updatedAt: string;
}

interface ReviewAnswers {
  overallRating: number;
  communicationRating: number;
  timelinessRating: number;
  careOfGoods: number;
  comments: string;
  wouldRecommend: boolean | null;
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-colors"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hover || value)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPageClient() {
  const searchParams = useSearchParams();
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobId = searchParams.get('jobId');
  const token = searchParams.get('token');
  const coId = searchParams.get('coId');

  const [answers, setAnswers] = useState<ReviewAnswers>({
    overallRating: 0,
    communicationRating: 0,
    timelinessRating: 0,
    careOfGoods: 0,
    comments: '',
    wouldRecommend: null,
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!jobId || !token) {
        setError('Missing required parameters: jobId and token');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [heroRes, brandingRes] = await Promise.all([
          fetch('/api/settings/hero'),
          fetch('/api/settings/branding'),
        ]);

        const heroData = heroRes.ok ? await heroRes.json() : null;
        const brandingData = brandingRes.ok ? await brandingRes.json() : null;

        setHero(heroData);
        setBranding(brandingData);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load review. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [jobId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (answers.overallRating === 0) {
      setError('Please provide an overall rating.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: jobId,
          token,
          companyId: coId,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setSubmitted(true);
    } catch {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading review...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error && (!jobId || !token)) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">
              {error || 'Missing required parameters. Please check your link and try again.'}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md mx-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600">
              Your review has been submitted successfully. We appreciate your feedback.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  const heroTitle = hero?.title || 'Customer Review';
  const heroSubtitle = hero?.subtitle || 'Share your experience with us';
  const heroBackground = hero?.backgroundColor || undefined;
  const logoUrl = branding?.logoUrl;
  const companyName = branding?.companyId || 'Moveware';
  const primaryColor = branding?.primaryColor || '#2563eb';

  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section
          className="bg-gradient-to-r from-blue-600 to-blue-800 text-white"
          style={{
            backgroundColor: heroBackground || undefined,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-3xl">
              {logoUrl ? (
                <div className="mb-6">
                  <img
                    src={logoUrl}
                    alt={`${companyName} logo`}
                    className="h-10 w-auto"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-xl font-bold opacity-90">{companyName}</h3>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {heroTitle}
              </h1>
              <p className="text-lg sm:text-xl opacity-90">{heroSubtitle}</p>
            </div>
          </div>
        </section>

        {/* Review Form */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Rate Your Experience
                </h2>
                <p className="text-sm text-gray-500">
                  Please rate each aspect of your experience below.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <StarRating
                  label="Overall Experience"
                  value={answers.overallRating}
                  onChange={(val) =>
                    setAnswers({ ...answers, overallRating: val })
                  }
                />

                <StarRating
                  label="Communication"
                  value={answers.communicationRating}
                  onChange={(val) =>
                    setAnswers({ ...answers, communicationRating: val })
                  }
                />

                <StarRating
                  label="Timeliness"
                  value={answers.timelinessRating}
                  onChange={(val) =>
                    setAnswers({ ...answers, timelinessRating: val })
                  }
                />

                <StarRating
                  label="Care of Goods"
                  value={answers.careOfGoods}
                  onChange={(val) =>
                    setAnswers({ ...answers, careOfGoods: val })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Would you recommend us?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setAnswers({ ...answers, wouldRecommend: true })
                    }
                    className={`px-6 py-2 rounded-lg border-2 font-medium transition-colors ${
                      answers.wouldRecommend === true
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAnswers({ ...answers, wouldRecommend: false })
                    }
                    className={`px-6 py-2 rounded-lg border-2 font-medium transition-colors ${
                      answers.wouldRecommend === false
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="comments"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Additional Comments
                </label>
                <textarea
                  id="comments"
                  rows={4}
                  value={answers.comments}
                  onChange={(e) =>
                    setAnswers({ ...answers, comments: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting || answers.overallRating === 0}
                  className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
