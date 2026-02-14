import { Metadata } from "next";
import { SettingsPageContent } from "@/lib/components/settings/settings-page-content";

export const metadata: Metadata = {
  title: "Settings - Moveware App",
  description: "Configure your application settings",
};

export default function SettingsPage() {
  return <SettingsPageContent />;
}
