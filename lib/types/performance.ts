/**
 * Performance Review & Survey Types
 */

export type QuestionType = 'rating' | 'yesno' | 'radio' | 'checkbox' | 'comment';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: QuestionOption[]; // For radio, checkbox
  maxRating?: number; // For rating questions
  placeholder?: string; // For comment questions
}

export interface QuestionResponse {
  questionId: string;
  value: string | string[] | number | boolean;
  comment?: string;
}

export interface PerformanceReview {
  id: string;
  jobId: number;
  title: string;
  description?: string;
  questions: Question[];
  responses?: QuestionResponse[];
  status: 'draft' | 'submitted' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewApiResponse {
  success: boolean;
  data?: PerformanceReview;
  error?: string;
}
