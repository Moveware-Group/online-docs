'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Building2 } from 'lucide-react';

export interface CompanyOption {
  id: string;
  name: string;
  brandCode: string;
  primaryColor?: string;
  logoUrl?: string;
}

interface CompanySearchDropdownProps {
  value: CompanyOption | null;
  onChange: (company: CompanyOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CompanySearchDropdown({
  value,
  onChange,
  placeholder = 'Search companies...',
  disabled = false,
}: CompanySearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/companies');
      const data = await res.json();
      // The API returns a bare array (not wrapped in { success, data })
      const companyList = Array.isArray(data) ? data : (data.data || []);
      setCompanies(
        companyList.map((c: Record<string, string>) => ({
          id: c.id,
          name: c.companyName || c.name,
          brandCode: c.brandCode,
          primaryColor: c.primaryColor,
          logoUrl: c.logoUrl,
        })),
      );
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.brandCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {value ? (
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{value.name}</span>
            <span className="text-xs text-gray-500">({value.brandCode})</span>
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No companies found</div>
            ) : (
              filtered.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => {
                    onChange(company);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                    value?.id === company.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {company.primaryColor && (
                    <div
                      className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: company.primaryColor }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{company.name}</div>
                    <div className="text-xs text-gray-500">{company.brandCode}</div>
                  </div>
                  {value?.id === company.id && (
                    <span className="text-blue-600 text-xs font-medium">Selected</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
