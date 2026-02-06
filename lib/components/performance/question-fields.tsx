import React from 'react';
import { Star } from 'lucide-react';
import { Question, QuestionResponse } from '@/lib/types/performance';

interface QuestionFieldProps {
  question: Question;
  value?: QuestionResponse['value'];
  onChange: (value: QuestionResponse['value']) => void;
  readOnly?: boolean;
}

/**
 * Rating Field Component
 * Displays star rating (1-5 or custom max)
 */
export function RatingField({ question, value, onChange, readOnly }: QuestionFieldProps) {
  const maxRating = question.maxRating || 5;
  const currentRating = typeof value === 'number' ? value : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => !readOnly && onChange(rating)}
            disabled={readOnly}
            className={`transition-all duration-200 ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label={`Rate ${rating} out of ${maxRating}`}
          >
            <Star
              className={`w-8 h-8 ${
                rating <= currentRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {currentRating > 0 && (
        <p className="text-sm text-gray-600">
          {currentRating} out of {maxRating} stars
        </p>
      )}
    </div>
  );
}

/**
 * Yes/No Field Component
 */
export function YesNoField({ question, value, onChange, readOnly }: QuestionFieldProps) {
  const currentValue = typeof value === 'boolean' ? value : null;

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => !readOnly && onChange(true)}
        disabled={readOnly}
        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          currentValue === true
            ? 'bg-green-500 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => !readOnly && onChange(false)}
        disabled={readOnly}
        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          currentValue === false
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        No
      </button>
    </div>
  );
}

/**
 * Radio Field Component
 */
export function RadioField({ question, value, onChange, readOnly }: QuestionFieldProps) {
  const currentValue = typeof value === 'string' ? value : '';

  if (!question.options || question.options.length === 0) {
    return <p className="text-sm text-gray-500">No options available</p>;
  }

  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
            currentValue === option.value
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={currentValue === option.value}
            onChange={(e) => !readOnly && onChange(e.target.value)}
            disabled={readOnly}
            className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-base text-gray-900 font-medium">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Checkbox Field Component
 */
export function CheckboxField({ question, value, onChange, readOnly }: QuestionFieldProps) {
  const currentValues = Array.isArray(value) ? value : [];

  if (!question.options || question.options.length === 0) {
    return <p className="text-sm text-gray-500">No options available</p>;
  }

  const handleToggle = (optionValue: string) => {
    if (readOnly) return;

    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v) => v !== optionValue)
      : [...currentValues, optionValue];

    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
            currentValues.includes(option.value)
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            value={option.value}
            checked={currentValues.includes(option.value)}
            onChange={() => handleToggle(option.value)}
            disabled={readOnly}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-base text-gray-900 font-medium">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Comment Field Component
 */
export function CommentField({ question, value, onChange, readOnly }: QuestionFieldProps) {
  const currentValue = typeof value === 'string' ? value : '';

  return (
    <div>
      <textarea
        value={currentValue}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={question.placeholder || 'Enter your comments...'}
        disabled={readOnly}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none disabled:bg-gray-50 disabled:text-gray-600"
      />
      <p className="mt-2 text-xs text-gray-500">
        {currentValue.length} characters
      </p>
    </div>
  );
}

/**
 * Generic Question Field Component
 * Renders the appropriate field based on question type
 */
export function QuestionField({ question, value, onChange, readOnly }: QuestionFieldProps) {
  const renderField = () => {
    switch (question.type) {
      case 'rating':
        return <RatingField question={question} value={value} onChange={onChange} readOnly={readOnly} />;
      case 'yesno':
        return <YesNoField question={question} value={value} onChange={onChange} readOnly={readOnly} />;
      case 'radio':
        return <RadioField question={question} value={value} onChange={onChange} readOnly={readOnly} />;
      case 'checkbox':
        return <CheckboxField question={question} value={value} onChange={onChange} readOnly={readOnly} />;
      case 'comment':
        return <CommentField question={question} value={value} onChange={onChange} readOnly={readOnly} />;
      default:
        return <p className="text-sm text-red-500">Unknown question type: {question.type}</p>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-start gap-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          {question.text}
        </h3>
        {question.required && (
          <span className="text-red-500 text-sm font-medium">*</span>
        )}
      </div>
      {renderField()}
    </div>
  );
}
