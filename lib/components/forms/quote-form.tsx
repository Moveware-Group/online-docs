'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import SignatureCanvas from './signature-canvas';

interface QuoteFormData {
  // Customer Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Move Details
  moveDate: string;
  moveType: 'local' | 'longDistance' | 'international' | '';
  fromAddress: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  toAddress: string;
  toCity: string;
  toState: string;
  toZip: string;
  
  // Property Details
  propertyType: 'house' | 'apartment' | 'condo' | 'storage' | '';
  bedrooms: string;
  additionalInfo: string;
  
  // Agreement
  agreeToTerms: boolean;
  signature: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    moveDate: '',
    moveType: '',
    fromAddress: '',
    fromCity: '',
    fromState: '',
    fromZip: '',
    toAddress: '',
    toCity: '',
    toState: '',
    toZip: '',
    propertyType: '',
    bedrooms: '',
    additionalInfo: '',
    agreeToTerms: false,
    signature: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Customer Information
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Move Details
    if (!formData.moveDate) {
      newErrors.moveDate = 'Move date is required';
    }
    if (!formData.moveType) {
      newErrors.moveType = 'Move type is required';
    }
    if (!formData.fromAddress.trim()) {
      newErrors.fromAddress = 'From address is required';
    }
    if (!formData.fromCity.trim()) {
      newErrors.fromCity = 'From city is required';
    }
    if (!formData.fromState.trim()) {
      newErrors.fromState = 'From state is required';
    }
    if (!formData.fromZip.trim()) {
      newErrors.fromZip = 'From ZIP code is required';
    }
    if (!formData.toAddress.trim()) {
      newErrors.toAddress = 'To address is required';
    }
    if (!formData.toCity.trim()) {
      newErrors.toCity = 'To city is required';
    }
    if (!formData.toState.trim()) {
      newErrors.toState = 'To state is required';
    }
    if (!formData.toZip.trim()) {
      newErrors.toZip = 'To ZIP code is required';
    }

    // Property Details
    if (!formData.propertyType) {
      newErrors.propertyType = 'Property type is required';
    }
    if (!formData.bedrooms.trim()) {
      newErrors.bedrooms = 'Number of bedrooms is required';
    }

    // Agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    if (!formData.signature) {
      newErrors.signature = 'Signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof QuoteFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstError);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote request');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to submit quote request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quote Request Submitted!</h2>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your quote request. We'll review your information and get back to you within 24 hours.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                moveDate: '',
                moveType: '',
                fromAddress: '',
                fromCity: '',
                fromState: '',
                fromZip: '',
                toAddress: '',
                toCity: '',
                toState: '',
                toZip: '',
                propertyType: '',
                bedrooms: '',
                additionalInfo: '',
                agreeToTerms: false,
                signature: '',
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Submit Another Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 md:p-12 space-y-10">
      {/* Customer Information Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="firstName" className="space-y-2">
            <label htmlFor="firstName-input" className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName-input"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
          </div>

          <div id="lastName" className="space-y-2">
            <label htmlFor="lastName-input" className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName-input"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
          </div>

          <div id="email" className="space-y-2">
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email-input"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="john.doe@example.com"
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div id="phone" className="space-y-2">
            <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone-input"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Move Details Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Move Details</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="moveDate" className="space-y-2">
              <label htmlFor="moveDate-input" className="block text-sm font-medium text-gray-700">
                Preferred Move Date <span className="text-red-500">*</span>
              </label>
              <input
                id="moveDate-input"
                type="date"
                value={formData.moveDate}
                onChange={(e) => handleInputChange('moveDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.moveDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.moveDate && <p className="text-sm text-red-600">{errors.moveDate}</p>}
            </div>

            <div id="moveType" className="space-y-2">
              <label htmlFor="moveType-input" className="block text-sm font-medium text-gray-700">
                Move Type <span className="text-red-500">*</span>
              </label>
              <select
                id="moveType-input"
                value={formData.moveType}
                onChange={(e) => handleInputChange('moveType', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.moveType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select move type</option>
                <option value="local">Local (within 50 miles)</option>
                <option value="longDistance">Long Distance (50+ miles)</option>
                <option value="international">International</option>
              </select>
              {errors.moveType && <p className="text-sm text-red-600">{errors.moveType}</p>}
            </div>
          </div>

          {/* From Address */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Moving From</h3>
            <div id="fromAddress" className="space-y-2">
              <label htmlFor="fromAddress-input" className="block text-sm font-medium text-gray-700">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                id="fromAddress-input"
                type="text"
                value={formData.fromAddress}
                onChange={(e) => handleInputChange('fromAddress', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.fromAddress ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="123 Main St"
              />
              {errors.fromAddress && <p className="text-sm text-red-600">{errors.fromAddress}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div id="fromCity" className="space-y-2">
                <label htmlFor="fromCity-input" className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="fromCity-input"
                  type="text"
                  value={formData.fromCity}
                  onChange={(e) => handleInputChange('fromCity', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.fromCity ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="New York"
                />
                {errors.fromCity && <p className="text-sm text-red-600">{errors.fromCity}</p>}
              </div>
              <div id="fromState" className="space-y-2">
                <label htmlFor="fromState-input" className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="fromState-input"
                  type="text"
                  value={formData.fromState}
                  onChange={(e) => handleInputChange('fromState', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.fromState ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="NY"
                  maxLength={2}
                />
                {errors.fromState && <p className="text-sm text-red-600">{errors.fromState}</p>}
              </div>
              <div id="fromZip" className="space-y-2">
                <label htmlFor="fromZip-input" className="block text-sm font-medium text-gray-700">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="fromZip-input"
                  type="text"
                  value={formData.fromZip}
                  onChange={(e) => handleInputChange('fromZip', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.fromZip ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="10001"
                  maxLength={10}
                />
                {errors.fromZip && <p className="text-sm text-red-600">{errors.fromZip}</p>}
              </div>
            </div>
          </div>

          {/* To Address */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Moving To</h3>
            <div id="toAddress" className="space-y-2">
              <label htmlFor="toAddress-input" className="block text-sm font-medium text-gray-700">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                id="toAddress-input"
                type="text"
                value={formData.toAddress}
                onChange={(e) => handleInputChange('toAddress', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.toAddress ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="456 Oak Ave"
              />
              {errors.toAddress && <p className="text-sm text-red-600">{errors.toAddress}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div id="toCity" className="space-y-2">
                <label htmlFor="toCity-input" className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="toCity-input"
                  type="text"
                  value={formData.toCity}
                  onChange={(e) => handleInputChange('toCity', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.toCity ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Los Angeles"
                />
                {errors.toCity && <p className="text-sm text-red-600">{errors.toCity}</p>}
              </div>
              <div id="toState" className="space-y-2">
                <label htmlFor="toState-input" className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="toState-input"
                  type="text"
                  value={formData.toState}
                  onChange={(e) => handleInputChange('toState', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.toState ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="CA"
                  maxLength={2}
                />
                {errors.toState && <p className="text-sm text-red-600">{errors.toState}</p>}
              </div>
              <div id="toZip" className="space-y-2">
                <label htmlFor="toZip-input" className="block text-sm font-medium text-gray-700">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="toZip-input"
                  type="text"
                  value={formData.toZip}
                  onChange={(e) => handleInputChange('toZip', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.toZip ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="90001"
                  maxLength={10}
                />
                {errors.toZip && <p className="text-sm text-red-600">{errors.toZip}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="propertyType" className="space-y-2">
            <label htmlFor="propertyType-input" className="block text-sm font-medium text-gray-700">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              id="propertyType-input"
              value={formData.propertyType}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.propertyType ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select property type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
              <option value="storage">Storage Unit</option>
            </select>
            {errors.propertyType && <p className="text-sm text-red-600">{errors.propertyType}</p>}
          </div>

          <div id="bedrooms" className="space-y-2">
            <label htmlFor="bedrooms-input" className="block text-sm font-medium text-gray-700">
              Number of Bedrooms <span className="text-red-500">*</span>
            </label>
            <select
              id="bedrooms-input"
              value={formData.bedrooms}
              onChange={(e) => handleInputChange('bedrooms', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.bedrooms ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select number</option>
              <option value="studio">Studio</option>
              <option value="1">1 Bedroom</option>
              <option value="2">2 Bedrooms</option>
              <option value="3">3 Bedrooms</option>
              <option value="4">4 Bedrooms</option>
              <option value="5+">5+ Bedrooms</option>
            </select>
            {errors.bedrooms && <p className="text-sm text-red-600">{errors.bedrooms}</p>}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
            Additional Information
          </label>
          <textarea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Any special items, access restrictions, or additional details..."
          />
          <p className="text-xs text-gray-500">Optional: Let us know about any special requirements</p>
        </div>
      </div>

      {/* Signature Section */}
      <div id="signature">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Agreement and Signature</h2>
        <div className="space-y-6">
          <div id="agreeToTerms" className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className={`mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 ${
                  errors.agreeToTerms ? 'border-red-300' : ''
                }`}
              />
              <span className="text-sm text-gray-700">
                I agree to the terms and conditions and authorize Moveware to contact me regarding my move quote request. I understand that this is not a binding quote and final pricing will be determined after an in-person or virtual assessment. <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-sm text-red-600 ml-8">{errors.agreeToTerms}</p>}
          </div>

          <SignatureCanvas
            value={formData.signature}
            onChange={(signature) => handleInputChange('signature', signature)}
            error={errors.signature}
          />
        </div>
      </div>

      {/* Submit Section */}
      <div className="pt-6 border-t border-gray-200">
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Submitting Request...
            </>
          ) : (
            <>
              Submit Quote Request
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          All fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>
    </form>
  );
}
