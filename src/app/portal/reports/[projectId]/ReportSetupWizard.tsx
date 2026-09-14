'use client';

import React, { useState, useMemo } from 'react';
import {
  INSTITUTE_CATEGORIES,
  BANK_SUB_TEMPLATES,
  InstituteCategory,
} from './constants';

export interface ReportSetupWizardProps {
  projectId: string;
  projectCode: string;
  prefill?: {
    ownerName?: string;
    ownerAddress?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  onComplete: (config: {
    clientType: 'individual' | 'organisation';
    organisationTemplate?: string;
    organisationSubTemplate?: string;
    institutionCategory?: string;
    bankName?: string;
    to?: string;
  }) => void;
}

export default function ReportSetupWizard({
  projectId,
  projectCode,
  prefill,
  onComplete,
}: ReportSetupWizardProps) {
  const [selectingOrg, setSelectingOrg] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showSubList, setShowSubList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategoryObj: InstituteCategory | undefined = useMemo(() => {
    return INSTITUTE_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  const filteredBanks: string[] = useMemo(() => {
    if (!activeCategoryObj?.list) return [];
    if (!searchQuery.trim()) return activeCategoryObj.list;
    const q = searchQuery.toLowerCase().trim();
    return activeCategoryObj.list.filter((b) => b.toLowerCase().includes(q));
  }, [activeCategoryObj, searchQuery]);

  const handleSelectClientType = (type: 'individual' | 'organisation') => {
    if (type === 'individual') {
      onComplete({
        clientType: 'individual',
        organisationTemplate: '',
        organisationSubTemplate: '',
        bankName: '',
        to: prefill?.contactName || prefill?.ownerName || '',
      });
    } else {
      setSelectingOrg(true);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    const category = INSTITUTE_CATEGORIES.find((c) => c.id === categoryId);
    const categoryLabel = category?.label || categoryId;

    if (categoryId === 'income_tax') {
      onComplete({
        clientType: 'organisation',
        organisationTemplate: 'INCOME_TAX',
        institutionCategory: categoryLabel,
        to: 'Income Tax Department',
      });
    } else if (categoryId === 'ibbi') {
      onComplete({
        clientType: 'organisation',
        organisationTemplate: 'IBBI_IVS',
        institutionCategory: categoryLabel,
        to: 'IBBI Registered Valuer Entity',
      });
    } else {
      setSelectedCategory(categoryId);
      setShowBankList(true);
      setSearchQuery('');
    }
  };

  const handleSelectOrganisation = (value: string) => {
    const normalizedKey = Object.keys(BANK_SUB_TEMPLATES).find(
      (k) => k.replace(/\s+/g, ' ').trim() === value.replace(/\s+/g, ' ').trim()
    );

    if (normalizedKey && BANK_SUB_TEMPLATES[normalizedKey]) {
      setSelectedBank(normalizedKey);
      setShowBankList(false);
      setShowSubList(true);
    } else {
      const categoryLabel = activeCategoryObj?.label || selectedCategory || '';
      onComplete({
        clientType: 'organisation',
        organisationTemplate: value,
        organisationSubTemplate: '',
        bankName: value,
        to: value,
        institutionCategory: categoryLabel,
      });
    }
  };

  const handleSelectSubTemplate = (subOpt: string) => {
    const fullBankName = `${selectedBank} - ${subOpt}`;
    const categoryLabel = activeCategoryObj?.label || selectedCategory || '';
    onComplete({
      clientType: 'organisation',
      organisationTemplate: selectedBank || '',
      organisationSubTemplate: subOpt,
      bankName: selectedBank || '',
      to: fullBankName,
      institutionCategory: categoryLabel,
    });
  };

  const handleWizardBack = () => {
    if (showSubList) {
      setShowSubList(false);
      setShowBankList(true);
      setSelectedBank(null);
    } else if (showBankList) {
      setShowBankList(false);
      setSelectedCategory(null);
      setSearchQuery('');
    } else if (selectingOrg) {
      setSelectingOrg(false);
    }
  };

  return (
    <div className="min-h-[520px] flex items-center justify-center bg-[#f8f9fa] p-4 sm:p-8 rounded-2xl border border-slate-200 text-slate-900">
      <div
        className={`${
          selectingOrg ? 'max-w-5xl' : 'max-w-2xl'
        } w-full text-center space-y-8 transition-all duration-300`}
      >
        {/* Header Title & Code */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2038] tracking-tight">
            Draft New Valuation Report
          </h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Set up the valuation parameters for Project{' '}
            <span className="font-mono font-bold text-[#b8860b]">{projectCode}</span>
          </p>
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !selectingOrg ? 'bg-[#b8860b]' : 'bg-slate-300'
              }`}
            />
            <span
              className={`w-8 h-[2px] ${
                selectingOrg ? 'bg-[#b8860b]' : 'bg-slate-200'
              }`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectingOrg ? 'bg-[#b8860b]' : 'bg-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Step 1: Choose client type (Individual vs Organisation) */}
        {!selectingOrg && (
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {/* Individual Card */}
            <button
              type="button"
              onClick={() => handleSelectClientType('individual')}
              className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-[#b8860b] shadow-xs hover:shadow-md transition-all duration-200 group text-center w-full cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-5 text-[#b8860b] group-hover:scale-105 transition-transform border border-amber-200">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0f2038] mb-2">Individual Client</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Standard valuation report formatted for private individuals, property owners, and non-institutional assignments.
              </p>
            </button>

            {/* Organisation Card */}
            <button
              type="button"
              onClick={() => handleSelectClientType('organisation')}
              className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-[#0f2038] shadow-xs hover:shadow-md transition-all duration-200 group text-center w-full cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-5 text-[#0f2038] group-hover:scale-105 transition-transform border border-blue-200">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#0f2038] mb-2">Organisation / Bank</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Institutional templates mapped to specific Bank, NBFC, Housing Finance, APF, Income Tax, or IBBI standards.
              </p>
            </button>
          </div>
        )}

        {/* Step 2: Organisation / Bank Selection Flow */}
        {selectingOrg && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#0f2038]">
                {showSubList
                  ? `Select Format for ${selectedBank}`
                  : showBankList
                  ? `Select from ${activeCategoryObj?.label || 'Institutions'}`
                  : 'Select Institution Category'}
              </h3>
              <button
                type="button"
                onClick={handleWizardBack}
                className="text-xs sm:text-sm text-[#b8860b] hover:text-[#8a6507] font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← Back
              </button>
            </div>

            {/* Sub-template format list (e.g., AGRI, HL-LAP, SBB, SME) */}
            {showSubList && selectedBank ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Select the required subclass or format variation:
                </p>
                <div className="flex flex-wrap gap-3 max-h-[380px] overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50 justify-center">
                  {BANK_SUB_TEMPLATES[selectedBank]?.map((subOpt) => (
                    <button
                      key={subOpt}
                      type="button"
                      onClick={() => handleSelectSubTemplate(subOpt)}
                      className="flex-1 min-w-[200px] max-w-[280px] p-4 min-h-[84px] rounded-xl border border-slate-200 bg-white hover:border-[#b8860b] hover:bg-amber-50/30 hover:shadow-xs text-center transition-all duration-150 flex items-center justify-center text-xs sm:text-sm font-semibold text-[#0f2038] shadow-xs break-words leading-tight cursor-pointer"
                    >
                      <span className="w-full line-clamp-3">{subOpt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : showBankList && selectedCategory ? (
              /* Bank / Organisation List */
              <div className="space-y-4">
                {/* Search Bar for quick filtering 60+ banks */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bank or institution name..."
                    className="w-full px-3.5 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#b8860b] focus:ring-1 focus:ring-[#b8860b] transition-colors"
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 max-h-[380px] overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50 justify-center">
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => handleSelectOrganisation(bank)}
                        className="flex-1 min-w-[200px] max-w-[280px] p-3.5 min-h-[84px] rounded-xl border border-slate-200 bg-white hover:border-[#b8860b] hover:bg-amber-50/30 hover:shadow-xs text-center transition-all duration-150 flex items-center justify-center text-xs sm:text-sm font-semibold text-[#0f2038] shadow-xs break-words leading-tight cursor-pointer"
                      >
                        <span className="w-full line-clamp-3">{bank}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 w-full">
                      No matching institutions found for &ldquo;{searchQuery}&rdquo;.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Category Selector Grid */
              <div className="flex flex-wrap gap-4 justify-center">
                {INSTITUTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className="flex-1 min-w-[150px] max-w-[190px] p-4 min-h-[110px] rounded-xl border border-slate-200 bg-white hover:border-[#b8860b] hover:bg-amber-50/30 hover:shadow-xs text-center transition-all duration-150 flex flex-col items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                    <span className="text-xs font-bold text-[#0f2038] leading-tight break-words max-w-full">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
