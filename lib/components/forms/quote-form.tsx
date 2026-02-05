'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  pickupAddress: string;
  deliveryAddress: string;
  moveDate: string;
  propertyType: string;
  bedrooms: string;
  additionalInfo: string;
}

export function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    name: '',
    email: '',
    phone: '',
    pickupAddress: '',
    deliveryAddress: '',
    moveDate: '',
    propertyType: 'house',
    bedrooms: '2',
    additionalInfo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Submit form data to API
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote');
      }

      setSubmitStatus('success');
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        pickupAddress: '',
        deliveryAddress: '',
        moveDate: '',
        propertyType: 'house',
        bedrooms: '2',
        additionalInfo: '',
      });
    } catch (error) {
      console.error('Error submitting quote:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Get Your Moving Quote</h2>
          <p className="text-gray-600">Fill out the form below and we'll get back to you with a detailed quote.</p>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Move Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Move Details</h3>

          <div>
            <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Address *
            </label>
            <Input
              id="pickupAddress"
              name="pickupAddress"
              type="text"
              required
              value={formData.pickupAddress}
              onChange={handleChange}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          <div>
            <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Address *
            </label>
            <Input
              id="deliveryAddress"
              name="deliveryAddress"
              type="text"
              required
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="456 Oak Ave, City, State ZIP"
            />
          </div>

          <div>
            <label htmlFor="moveDate" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Move Date *
            </label>
            <Input
              id="moveDate"
              name="moveDate"
              type="date"
              required
              value={formData.moveDate}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                Property Type *
              </label>
              <select
                id="propertyType"
                name="propertyType"
                required
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Bedrooms
              </label>
              <select
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="studio">Studio</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5+">5+ Bedrooms</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              rows={4}
              value={formData.additionalInfo}
              onChange={handleChange}
              placeholder="Tell us about special items, stairs, parking, or any other details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit Status Messages */}
        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">Quote request submitted successfully! We'll contact you soon.</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Failed to submit quote. Please try again.</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Get Your Free Quote'}
        </Button>
      </form>
    </Card>
  );
}
