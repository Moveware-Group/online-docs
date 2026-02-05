'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export function QuoteForm() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s()+-]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Company name validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    // Contact name validation
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    } else if (formData.contactName.trim().length < 2) {
      newErrors.contactName = 'Contact name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Please provide details about your requirements';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Please provide at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true });
    
    // Validate single field on blur
    const newErrors = { ...errors };
    
    switch (field) {
      case 'companyName':
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Company name is required';
        } else if (formData.companyName.trim().length < 2) {
          newErrors.companyName = 'Company name must be at least 2 characters';
        } else {
          delete newErrors.companyName;
        }
        break;
      case 'contactName':
        if (!formData.contactName.trim()) {
          newErrors.contactName = 'Contact name is required';
        } else if (formData.contactName.trim().length < 2) {
          newErrors.contactName = 'Contact name must be at least 2 characters';
        } else {
          delete newErrors.contactName;
        }
        break;
      case 'email':
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!validatePhone(formData.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'message':
        if (!formData.message.trim()) {
          newErrors.message = 'Please provide details about your requirements';
        } else if (formData.message.trim().length < 10) {
          newErrors.message = 'Please provide at least 10 characters';
        } else {
          delete newErrors.message;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      companyName: true,
      contactName: true,
      email: true,
      phone: true,
      message: true,
    });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/quotes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          message: '',
        });
        setTouched({});
        setErrors({});
      }, 2000);
    } catch (error) {
      console.error('Error submitting quote request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (field: keyof FormData): boolean => {
    return touched[field] && !!errors[field];
  };

  if (submitStatus === 'success') {
    return (
      <Card className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your interest. We've received your quote request and will get back to you within 24 hours.
        </p>
        <Button
          onClick={() => setSubmitStatus('idle')}
          variant="outline"
          className="mx-auto"
        >
          Submit Another Request
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            onBlur={() => handleBlur('companyName')}
            placeholder="Enter your company name"
            className={showError('companyName') ? 'border-red-500 focus:ring-red-500' : ''}
            aria-invalid={showError('companyName')}
            aria-describedby={showError('companyName') ? 'companyName-error' : undefined}
          />
          {showError('companyName') && (
            <p id="companyName-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.companyName}
            </p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="contactName"
            type="text"
            value={formData.contactName}
            onChange={(e) => handleChange('contactName', e.target.value)}
            onBlur={() => handleBlur('contactName')}
            placeholder="Enter your full name"
            className={showError('contactName') ? 'border-red-500 focus:ring-red-500' : ''}
            aria-invalid={showError('contactName')}
            aria-describedby={showError('contactName') ? 'contactName-error' : undefined}
          />
          {showError('contactName') && (
            <p id="contactName-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.contactName}
            </p>
          )}
        </div>

        {/* Email and Phone - Side by side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="your.email@company.com"
              className={showError('email') ? 'border-red-500 focus:ring-red-500' : ''}
              aria-invalid={showError('email')}
              aria-describedby={showError('email') ? 'email-error' : undefined}
            />
            {showError('email') && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="+1 (555) 123-4567"
              className={showError('phone') ? 'border-red-500 focus:ring-red-500' : ''}
              aria-invalid={showError('phone')}
              aria-describedby={showError('phone') ? 'phone-error' : undefined}
            />
            {showError('phone') && (
              <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Project Requirements <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            rows={6}
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            onBlur={() => handleBlur('message')}
            placeholder="Please describe your documentation needs, project scope, timeline, and any specific requirements..."
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              showError('message') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
            aria-invalid={showError('message')}
            aria-describedby={showError('message') ? 'message-error' : undefined}
          />
          {showError('message') && (
            <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.message.length}/500 characters
          </p>
        </div>

        {/* Submit Error */}
        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Submission Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  We couldn't submit your quote request. Please try again or contact us directly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none sm:min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Request Quote'
            )}
          </Button>
          <p className="text-sm text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is secure and confidential
          </p>
        </div>
      </form>
    </Card>
  );
}
