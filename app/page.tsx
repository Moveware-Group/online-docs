import { config } from '@/lib/config';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Moveware App
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Modern application powered by Moveware API
        </p>
        
        <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuration Status
          </h2>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">API URL:</span>
              <span className="font-medium text-gray-900">
                {config.moveware.apiUrl ? '✓ Configured' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">API Key:</span>
              <span className="font-medium text-gray-900">
                {config.moveware.apiKey ? '✓ Configured' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Environment:</span>
              <span className="font-medium text-gray-900">
                {config.nodeEnv}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
