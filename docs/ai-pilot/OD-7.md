# OD-7: Build client-facing Online Performance Review page (UI with mock data)

## Notes

I'll analyze the repository structure and create the Online Performance Review page with the specified components.

<read_file>
<path>.</path>
</read_file>

<read_file>
<path>src</path>
</read_file>

<read_file>
<path>src/app</path>
</read_file>

<read_file>
<path>src/components</path>
</read_file>

<read_file>
<path>package.json</path>
</read_file>

<read_file>
<path>src/app/layout.tsx</path>
</read_file>

<read_file>
<path>src/app/page.tsx</path>
</read_file>

<read_file>
<path>tailwind.config.ts</path>
</read_file>

<read_file>
<path>src/app/globals.css</path>
</read_file>

Now let me check if there are any existing components I can reference:

<read_file>
<path>src/lib</path>
</read_file>

Let me create the Online Performance Review page with all the required components:

<write_file>
<path>src/app/review/page.tsx</path>
<content>'use client';

import { useState } from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';

// Mock data for the review
const mockReviewData = {
  branding: {
    companyName: 'Acme Corporation',
    logo: '/logo.png', // placeholder
    primaryColor: '#2563eb',
  },
  hero: {
    title: 'Online Performance Review',
    subtitle: 'Help us improve by sharing your experience',
    backgroundImage: '/hero-bg.jpg', // placeholder
  },
  copy: {
    introduction: 'Thank you for taking the time to complete this performance review. Your feedback is valuable and helps us continuously improve our services.',
    instructions: 'Please answer all questions honestly. This review should take approximately 5-10 minutes to complete.',
  },
  questions: [
    {
      id: 'q1',
      type: 'star-rating',
      question: 'How would you rate your overall experience?',
      required: true,
      maxStars: 5,
    },
    {
      id: 'q2',
      type: 'star-rating',
      question: 'How satisfied are you with the quality of service?',
      required: true,
      maxStars: 5,
    },
    {
      id: 'q3',
      type: 'yes-no',
      question: 'Would you recommend our services to others?',
      required: true,
    },
    {
      id: 'q4',
      type: 'radio',
      question: 'How often do you use our services?',
      required: true,
      options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
    },
    {
      id: 'q5',
      type: 'checkbox',
      question: 'Which aspects did you find most valuable? (Select all that apply)',
      required: false,
      options: ['Customer Support', 'Product Quality', 'Pricing', 'Ease of Use', 'Reliability'],
    },
    {
      id: 'q6',
      type: 'comment',
      question: 'What could we do to improve your experience?',
      required: false,
      placeholder: 'Please share your thoughts...',
    },
    {
      id: 'q7',
      type: 'comment',
      question: 'Any additional comments or feedback?',
      required: false,
      placeholder: 'Optional feedback...',
    },
  ],
};

type Answer = string | number | string[] | boolean | null;

export default function OnlinePerformanceReview() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleStarRating = (questionId: string, rating: number) => {
    setAnswers({ ...answers, [questionId]: rating });
  };

  const handleYesNo = (questionId: string, value: boolean) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleRadio = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleCheckbox = (questionId: string, option: string) => {
    const currentAnswers = (answers[questionId] as string[]) || [];
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter((a) => a !== option)
      : [...currentAnswers, option];
    setAnswers({ ...answers, [questionId]: newAnswers });
  };

  const handleComment = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredQuestions = mockReviewData.questions.filter((q) => q.required);
    const missingAnswers = requiredQuestions.filter((q) => !answers[q.id]);
    
    if (missingAnswers.length > 0) {
      alert('Please answer all required questions.');
      return;
    }

    console.log('Submitted answers:', answers);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600">
            Your feedback has been submitted successfully. We appreciate you taking the time to complete this review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div
        className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4"
        style={{ backgroundColor: mockReviewData.branding.primaryColor }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <div className="text-2xl font-bold">{mockReviewData.branding.companyName}</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{mockReviewData.hero.title}</h1>
          <p className="text-xl text-blue-100">{mockReviewData.hero.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-4">{mockReviewData.copy.introduction}</p>
            <p className="text-gray-600">{mockReviewData.copy.instructions}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mockReviewData.questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-800 mb-2">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {/* Star Rating */}
                {question.type === 'star-rating' && (
                  <div className="flex gap-2">
                    {[...Array(question.maxStars)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleStarRating(question.id, i + 1)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            (answers[question.id] as number) >= i + 1
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {answers[question.id] && (
                      <span className="ml-2 text-gray-600 self-center">
                        {answers[question.id]} / {question.maxStars}
                      </span>
                    )}
                  </div>
                )}

                {/* Yes/No */}
                {question.type === 'yes-no' && (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleYesNo(question.id, true)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                        answers[question.id] === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleYesNo(question.id, false)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                        answers[question.id] === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-red-300'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                      No
                    </button>
                  </div>
                )}

                {/* Radio */}
                {question.type === 'radio' && (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => handleRadio(question.id, option)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {question.type === 'checkbox' && (
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={((answers[question.id] as string[]) || []).includes(option)}
                          onChange={() => handleCheckbox(question.id, option)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Comment */}
                {question.type === 'comment' && (
                  <textarea
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => handleComment(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-colors duration-200"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
</content>
</write_file>

Now let me create a README to document the component:

<write_file>
<path>src/app/review/README.md</path>
<content># Online Performance Review Page

## Overview
Client-facing performance review page with dynamic question rendering and configurable branding.

## Features
- **Hero Banner**: Customizable with company branding and messaging
- **Configurable Copy**: Introduction and instructions text
- **Dynamic Question Types**:
  - ⭐ Star Ratings (1-5 stars)
  - ✓/✗ Yes/No questions
  - ○ Radio buttons (single choice)
  - ☑ Checkboxes (multiple choice)
  - 💬 Comment fields (text areas)
- **Form Validation**: Required field checking
- **Success State**: Thank you message after submission
- **Responsive Design**: Mobile-friendly layout

## Mock Data Structure
The page currently uses mock data defined in `mockReviewData` object:

```typescript
{
  branding: {
    companyName: string,
    logo: string,
    primaryColor: string,
  },
  hero: {
    title: string,
    subtitle: string,
    backgroundImage: string,
  },
  copy: {
    introduction: string,
    instructions: string,
  },
  questions: Array<Question>
}
```

## Question Types
Each question supports:
- `id`: Unique identifier
- `type`: 'star-rating' | 'yes-no' | 'radio' | 'checkbox' | 'comment'
- `question`: Question text
- `required`: Boolean flag
- `options`: Array of choices (for radio/checkbox)
- `placeholder`: Placeholder text (for comments)
- `maxStars`: Number of stars (for star-rating)

## Usage
Navigate to `/review` to view the page.

## Next Steps
- Replace mock data with API integration
- Add backend submission endpoint
- Implement data persistence
- Add analytics tracking
- Enhance accessibility features
</content>
</write_file>

Let me also update the main page to include a link to the review page for easy navigation:

<read_file>
<path>src/app/page.tsx</path>
</read_file>

<write_file>
<path>src/app/page.tsx</path>
<content>import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2
