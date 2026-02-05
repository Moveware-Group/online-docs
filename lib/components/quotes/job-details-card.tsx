import { JobDetails } from '@/lib/types/quote';
import { Calendar, MapPin, User, Mail, Phone, FileText } from 'lucide-react';

interface JobDetailsCardProps {
  jobDetails: JobDetails;
}

export function JobDetailsCard({ jobDetails }: JobDetailsCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
          <p className="text-sm text-gray-600 mt-1">Quote #{jobDetails.quoteNumber}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
            getStatusColor(jobDetails.status)
          }`}
        >
          {jobDetails.status}
        </span>
      </div>

      <div className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Customer Information
          </h3>
          <div className="space-y-2 ml-7">
            <p className="text-gray-700">
              <span className="font-medium">Name:</span> {jobDetails.customer.name}
            </p>
            <p className="text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {jobDetails.customer.email}
            </p>
            <p className="text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {jobDetails.customer.phone}
            </p>
          </div>
        </div>

        {/* Move Date */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Scheduled Move Date
          </h3>
          <p className="text-gray-700 ml-7">{formatDate(jobDetails.moveDate)}</p>
        </div>

        {/* Locations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Locations
          </h3>
          <div className="space-y-4 ml-7">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Origin</p>
              <p className="text-gray-700">
                {jobDetails.origin.street}
                <br />
                {jobDetails.origin.city}, {jobDetails.origin.state} {jobDetails.origin.postcode}
                {jobDetails.origin.country && <><br />{jobDetails.origin.country}</>}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Destination</p>
              <p className="text-gray-700">
                {jobDetails.destination.street}
                <br />
                {jobDetails.destination.city}, {jobDetails.destination.state}{' '}
                {jobDetails.destination.postcode}
                {jobDetails.destination.country && <><br />{jobDetails.destination.country}</>}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {jobDetails.notes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Additional Notes
            </h3>
            <p className="text-gray-700 ml-7 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {jobDetails.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
