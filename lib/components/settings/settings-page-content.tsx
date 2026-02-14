"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, User, Shield, Bot, Building2 } from "lucide-react";

const tabs = [
  {
    name: "Profile",
    href: "/settings",
    icon: User,
    exact: true,
  },
  {
    name: "Account",
    href: "/settings/account",
    icon: Settings,
  },
  {
    name: "Security",
    href: "/settings/security",
    icon: Shield,
  },
  {
    name: "AI Assistant",
    href: "/settings/ai-assistant",
    icon: Bot,
  },
  {
    name: "Companies",
    href: "/settings/companies",
    icon: Building2,
  },
];

interface SettingsPageContentProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function SettingsPageContent({
  children,
  title = "Settings",
  description = "Manage your account settings and preferences",
}: SettingsPageContentProps) {
  const pathname = usePathname();

  const isActive = (tab: (typeof tabs)[0]) => {
    if (tab.exact) {
      return pathname === tab.href;
    }
    return pathname?.startsWith(tab.href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-base text-gray-600">{description}</p>
          </div>

          {/* Tab Navigation */}
          <nav
            className="flex space-x-8 -mb-px"
            aria-label="Settings navigation"
            role="tablist"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab);

              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-all duration-200
                    ${
                      active
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }
                  `}
                  aria-label={`${tab.name} settings`}
                  aria-current={active ? "page" : undefined}
                  role="tab"
                  aria-selected={active}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                      ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}
                    `}
                    aria-hidden="true"
                  />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">{children}</div>
      </main>
    </div>
  );
}
