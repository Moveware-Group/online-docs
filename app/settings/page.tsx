import { Metadata } from "next";
import SettingsPageContent from "@/lib/components/settings/settings-page-content";

export const metadata: Metadata = {
  title: "Settings - Moveware App",
  description: "Configure your application settings",
};

export default function SettingsPage() {
  return (
    <SettingsPageContent>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Profile Settings
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your profile information and preferences.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
          </div>

          <div className="pt-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </SettingsPageContent>
  );
}
