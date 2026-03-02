'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { Loader2, Send, CheckCircle, PenLine } from 'lucide-react';

// ─── Moveware question types ────────────────────────────────────────────────

type MwControlType =
  | 'radio'
  | 'checkbox'
  | 'Valuation'
  | 'Combo'
  | 'Signature'
  | 'image feedback'
  | 'rating'
  | 'heading';

interface MwQuestion {
  id: number | string;
  question: string;
  controlType: MwControlType;
  conditionalParent?: number | string | null;
  conditionalAnswer?: string | null;
  responses?: string[];
  showEditor?: 'Y' | 'N';
  sort?: number;
  type?: string;
}

interface MwReview {
  id: number | string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

interface BrandingSettings {
  id: string;
  companyId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

// answers keyed by questionId: string (single) or string[] (multi) or number
type AnswerMap = Record<string | number, string | string[] | number | null>;

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Star / image-feedback rating (1–5 emoji stars) */
function StarRating({
  questionId,
  value,
  onChange,
}: {
  questionId: string | number;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          data-qid={questionId}
          className="text-3xl transition-transform hover:scale-110"
        >
          <span
            className={star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

/** Canvas-based signature pad */
function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = pos;
    onChange(canvas.toDataURL());
  };

  const endDraw = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  // Restore existing value
  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      };
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full border border-gray-300 rounded-lg bg-white touch-none cursor-crosshair"
        style={{ maxHeight: '160px' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex items-center gap-3 mt-2">
        {value && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <PenLine className="w-4 h-4" />
            <span>Signature captured</span>
          </div>
        )}
        <button
          type="button"
          onClick={clear}
          className="ml-auto text-sm text-gray-500 underline hover:text-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// ─── Dynamic question renderer ───────────────────────────────────────────────

function QuestionField({
  question,
  answer,
  onChange,
}: {
  question: MwQuestion;
  answer: string | string[] | number | null;
  onChange: (qId: string | number, value: string | string[] | number | null) => void;
}) {
  const { id, controlType, question: label, responses = [], showEditor } = question;

  const handleSingleChange = (val: string | number | null) => onChange(id, val);

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const current = Array.isArray(answer) ? answer : [];
    const next = checked ? [...current, option] : current.filter((v) => v !== option);
    onChange(id, next);
  };

  const renderControl = () => {
    switch (controlType) {
      case 'heading':
        return null; // heading is rendered in parent

      case 'radio':
        return (
          <div className="space-y-2 mt-2">
            {responses.map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name={String(id)}
                  value={opt}
                  checked={answer === opt}
                  onChange={() => handleSingleChange(opt)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2 mt-2">
            {responses.map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  value={opt}
                  checked={Array.isArray(answer) ? answer.includes(opt) : false}
                  onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'Combo':
        return (
          <select
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => handleSingleChange(e.target.value || null)}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">— Select an option —</option>
            {responses.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'Valuation':
        return (
          <input
            type="number"
            value={answer !== null && answer !== undefined ? String(answer) : ''}
            onChange={(e) =>
              handleSingleChange(e.target.value ? parseFloat(e.target.value) : null)
            }
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter value..."
          />
        );

      case 'image feedback':
      case 'rating':
        return (
          <StarRating
            questionId={id}
            value={typeof answer === 'number' ? answer : 0}
            onChange={(v) => handleSingleChange(v)}
          />
        );

      case 'Signature':
        return (
          <SignaturePad
            value={typeof answer === 'string' ? answer : ''}
            onChange={(dataUrl) => handleSingleChange(dataUrl || null)}
          />
        );

      default:
        return (
          <input
            type="text"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => handleSingleChange(e.target.value || null)}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      {controlType === 'heading' ? (
        <h3 className="text-base font-semibold text-gray-800">{label}</h3>
      ) : (
        <>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {renderControl()}
          
        </>
      )}
    </div>
  );
}

// ─── Preview / demo questions (one per controlType) ──────────────────────────

const PREVIEW_QUESTIONS: MwQuestion[] = [
  {
    id: 'p1',
    question: 'Your Move Experience',
    controlType: 'heading',
    sort: 1,
    type: 'General',
  },
  {
    id: 'p2',
    question: 'How would you rate your overall experience?',
    controlType: 'rating',
    sort: 2,
    type: 'General',
  },
  {
    id: 'p3',
    question: 'Which aspects of the service stood out? (select all that apply)',
    controlType: 'checkbox',
    responses: ['Punctuality', 'Care of goods', 'Friendly crew', 'Value for money', 'Communication'],
    sort: 3,
    type: 'General',
  },
  {
    id: 'p4',
    question: 'How did you find the crew on the day?',
    controlType: 'radio',
    responses: ['Excellent', 'Good', 'Average', 'Below average'],
    sort: 4,
    type: 'Service',
  },
  {
    id: 'p5',
    question: 'Please rate the condition of your goods on delivery',
    controlType: 'image feedback',
    sort: 5,
    type: 'Service',
  },
  {
    id: 'p6',
    question: 'Would you use us again?',
    controlType: 'Combo',
    responses: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'],
    sort: 6,
    type: 'Service',
  },
  {
    id: 'p7',
    question: 'Please describe any damage or issues (only shown if checkbox above includes "Care of goods")',
    controlType: 'radio',
    responses: ['No issues', 'Minor scratch', 'Significant damage'],
    conditionalParent: 'p3',
    conditionalAnswer: 'Care of goods',
    sort: 7,
    type: 'Service',
    showEditor: 'Y',
  },
  {
    id: 'p8',
    question: 'Declared value of goods (for insurance reference)',
    controlType: 'Valuation',
    sort: 8,
    type: 'Insurance',
  },
  {
    id: 'p9',
    question: 'Please sign below to confirm your review',
    controlType: 'Signature',
    sort: 9,
    type: 'Insurance',
  },
];

// ─── Main page component ──────────────────────────────────────────────────────

export default function ReviewPageClient() {
  const searchParams = useSearchParams();
  const jobId   = searchParams.get('jobId');
  const token   = searchParams.get('token');
  const coId    = searchParams.get('coId');
  const preview = searchParams.get('preview') === '1';

  const [branding,   setBranding]   = useState<BrandingSettings | null>(null);
  const [reviews,    setReviews]    = useState<MwReview[]>([]);
  const [questions,  setQuestions]  = useState<MwQuestion[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [editors, setEditors] = useState<AnswerMap>({}); // showEditor free-text per question

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!preview && (!jobId || !token)) {
      setError('Missing required parameters: jobId and token');
      setLoading(false);
      return;
    }

    // ── Preview / demo mode — loads one question of every type ──────────────
    if (preview) {
      setQuestions(PREVIEW_QUESTIONS);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const base = coId ? `?coId=${encodeURIComponent(coId)}` : '';

        const [brandingRes, reviewsRes, questionsRes] = await Promise.all([
          fetch(`/api/settings/branding${base}`),
          fetch(`/api/jobs/${jobId}/reviews${base}`),
          fetch(`/api/jobs/${jobId}/questions${base}`),
        ]);

        if (brandingRes.ok) {
          const d = await brandingRes.json();
          setBranding(d?.data ?? d);
        }

        if (reviewsRes.ok) {
          const d = await reviewsRes.json();
          const raw = d?.data ?? d;
          setReviews(Array.isArray(raw) ? raw : raw?.results ?? []);
        }

        if (questionsRes.ok) {
          const d = await questionsRes.json();
          const raw = d?.data ?? d;
          const list: MwQuestion[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.results)
            ? raw.results
            : [];
          // Sort by `sort` field ascending
          list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
          setQuestions(list);
        } else {
          // Fallback: no questions configured
          setQuestions([]);
        }
      } catch (err) {
        console.error('[review] load error:', err);
        setError('Failed to load review. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, token, coId, preview]);

  // ── Conditional visibility ─────────────────────────────────────────────────
  const isVisible = useCallback(
    (q: MwQuestion): boolean => {
      if (!q.conditionalParent) return true;
      const parentAnswer = answers[q.conditionalParent];
      if (!parentAnswer) return false;
      if (!q.conditionalAnswer) return !!parentAnswer;
      // For array answers (checkbox), check includes
      if (Array.isArray(parentAnswer)) return parentAnswer.includes(q.conditionalAnswer);
      return String(parentAnswer) === String(q.conditionalAnswer);
    },
    [answers],
  );

  const handleAnswerChange = (qId: string | number, value: string | string[] | number | null) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleEditorChange = (qId: string | number, value: string) => {
    setEditors((prev) => ({ ...prev, [qId]: value }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Build answer payload: each question with its answer (and optional editor text)
    const payload = questions
      .filter(isVisible)
      .filter((q) => q.controlType !== 'heading')
      .map((q) => ({
        questionId:   q.id,
        question:     q.question,
        controlType:  q.controlType,
        answer:       answers[q.id] ?? null,
        editorText:   editors[q.id] ?? null,
      }));

    try {
      const res = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          token,
          companyId: coId,
          reviewTypes: reviews.map((r) => r.type ?? r.id),
          answers: payload,
        }),
      });

      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Group questions by `type` ──────────────────────────────────────────────
  const grouped = questions.reduce<Record<string, MwQuestion[]>>((acc, q) => {
    const key = q.type ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped);

  // ── Branding helpers ───────────────────────────────────────────────────────
  const primaryColor = branding?.primaryColor || '#2563eb';
  const logoUrl      = branding?.logoUrl;

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
            <p className="text-gray-600">Loading review…</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!jobId || !token) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600">
              This review link is missing required parameters. Please check your link and try again.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
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

  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section
          className="text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="h-10 w-auto mb-6" />
            ) : null}
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Share Your Experience</h1>
            <p className="text-lg opacity-90">
              We&apos;d love to hear how your move went. Your feedback helps us improve.
            </p>
          </div>
        </section>

        {/* Form */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 pb-16">
          {preview && (
            <div className="mb-4 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm font-medium text-center">
              Preview mode — sample questions shown. Submissions are not saved.
            </div>
          )}
          <form onSubmit={preview ? (e) => e.preventDefault() : handleSubmit}>
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {questions.length === 0 ? (
                /* Fallback when no questions configured */
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
                  <p className="text-gray-500 text-sm text-center py-6">
                    No review questions are currently configured for this job.
                  </p>
                </div>
              ) : (
                groupNames.map((group) => (
                  <div key={group} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {groupNames.length > 1 && (
                      <div
                        className="px-6 py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {group}
                      </div>
                    )}
                    <div className="px-6 py-2">
                      {grouped[group].map((q) => {
                        if (!isVisible(q)) return null;
                        return (
                          <div key={q.id}>
                            <QuestionField
                              question={q}
                              answer={answers[q.id] ?? null}
                              onChange={handleAnswerChange}
                            />
                            {/* showEditor free-text sits beneath the question field */}
                            {q.showEditor === 'Y' && q.controlType !== 'heading' && (
                              <div className="-mt-2 pb-4">
                                <textarea
                                  rows={3}
                                  placeholder="Additional comments…"
                                  value={String(editors[q.id] ?? '')}
                                  onChange={(e) => handleEditorChange(q.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Submit */}
              {questions.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-7 py-3 text-white font-semibold rounded-xl shadow transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
