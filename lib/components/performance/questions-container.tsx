'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, Edit2 } from 'lucide-react';
import { PerformanceReview, QuestionResponse } from '@/lib/types/performance';
import { QuestionField } from './question-fields';

interface QuestionsContainerProps {
  jobId: string;
  companyId: number;
  initialReadOnly?: boolean;
}

export function QuestionsContainer({ jobId, companyId, initialReadOnly = false }: QuestionsContainerProps) {
  const [review, setReview] = useState<PerformanceReview | null>(null);
  const [responses, setResponses] = useState<Record<string, QuestionResponse['value']>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/jobs/${jobId}/questions?coId=${companyId}`, {
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setReview(data.data);
          
          // Initialize responses from existing data if available
          if (data.data.responses) {
            const initialResponses: Record<string, QuestionResponse['value']> = {};
            data.data.responses.forEach((resp: QuestionResponse) => {
              initialResponses[resp.questionId] = resp.value;
            });
            setResponses(initialResponses);
          }
        } else {
          throw new Error(data.error || 'Failed to load questions');
        }
      } catch (err) {
        // Ignore abort errors - these are expected when the effect re-runs
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        console.error('Error fetching questions:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        // Only update loading state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchQuestions();

    // Cleanup function: abort the request if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [jobId, companyId, retryTrigger]);

  const handleResponseChange = (questionId: string, value: QuestionResponse['value']) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleRetry = () => {
    // Increment retry trigger to force useEffect to re-run
    setRetryTrigger((prev) => prev + 1);
  };

  const toggleReadOnly = () => {
    setReadOnly((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">Error Loading Questions</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!review || !review.questions || review.questions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Available</h3>
        <p className="text-gray-600">There are no performance review questions for this job.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{review.title}</h2>
            {review.description && (
              <p className="text-gray-600">{review.description}</p>
            )}
          </div>
          <button
            onClick={toggleReadOnly}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {readOnly ? (
              <>
                <Edit2 className="w-4 h-4" />
                <span>Edit Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>View Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {review.questions.map((question, index) => (
          <div key={question.id}>
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-500">
                Question {index + 1} of {review.questions.length}
              </span>
            </div>
            <QuestionField
              question={question}
              value={responses[question.id]}
              onChange={(value) => handleResponseChange(question.id, value)}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Changes are not saved automatically. This is a preview mode for reviewing and entering responses.
          {readOnly && ' Switch to Edit Mode to make changes.'}
        </p>
      </div>
    </div>
  );
}
