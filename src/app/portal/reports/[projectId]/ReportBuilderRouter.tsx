'use client';

import { useState, useCallback } from 'react';
import GeneralReportBuilder from './GeneralReportBuilder';
import IBBIReportBuilder from './IBBIReportBuilder';
import IncomeTaxReportBuilder from './IncomeTaxReportBuilder';
import { saveReportDraft } from '@/app/actions/project';
import type { ReportFields } from './GeneralReportBuilder';

const DEFAULT_FIELDS: Partial<ReportFields> = {
  clientType: '',
  organisationTemplate: '',
  institutionCategory: '',
  organisationSubTemplate: '',
};

interface ReportBuilderRouterProps {
  projectId: string;
  projectCode: string;
  initialFields: ReportFields | null;
  status: string;
  userRole: string;
  bucketImages: any[];
  prefill: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    propertyAddress: string;
    propertyType: string;
    purpose: string;
  };
}

type BuilderType = 'general' | 'ibbi' | 'income_tax' | 'wizard';

export default function ReportBuilderRouter({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages,
  prefill,
}: ReportBuilderRouterProps) {
  const [builder, setBuilder] = useState<BuilderType>(() => {
    if (initialFields?.organisationTemplate === 'IBBI_IVS') return 'ibbi';
    if (initialFields?.organisationTemplate === 'INCOME_TAX') return 'income_tax';
    if (initialFields?.clientType) return 'general';
    return 'wizard';
  });

  const [wizardStep, setWizardStep] = useState<'setup' | 'completed'>('setup');
  const [selectingOrg, setSelectingOrg] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showSubList, setShowSubList] = useState(false);

  const saveAndNavigate = async (updates: Partial<ReportFields>, targetBuilder: BuilderType) => {
    const updatedFields = { ...initialFields, ...DEFAULT_FIELDS, ...updates } as ReportFields;
    try {
      await saveReportDraft(projectId, updatedFields);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
    setBuilder(targetBuilder);
  };

  const handleSelectClientType = useCallback((type: 'individual' | 'organisation') => {
    if (type === 'individual') {
      saveAndNavigate({ clientType: 'individual', organisationTemplate: '' }, 'general');
    } else {
      setSelectingOrg(true);
    }
  }, [initialFields, projectId]);

  const handleSelectOrganisation = useCallback((value: string) => {
    setSelectedBank(value);
    setShowBankList(false);
    setShowSubList(true);
  }, []);

  const handleSelectSubTemplate = useCallback((subOpt: string) => {
    const fullBankName = `${selectedBank} - ${subOpt}`;
    saveAndNavigate({
      clientType: 'organisation',
      organisationTemplate: selectedBank || '',
      organisationSubTemplate: subOpt,
      bankName: selectedBank || '',
    }, 'general');
    setSelectingOrg(false);
    setSelectedCategory(null);
    setShowBankList(false);
    setShowSubList(false);
    setSelectedBank(null);
  }, [selectedBank, projectId, initialFields]);

  const handleCategoryClick = useCallback((category: string) => {
    const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (category === 'income_tax') {
      saveAndNavigate({
        clientType: 'organisation',
        organisationTemplate: 'INCOME_TAX',
        institutionCategory: categoryLabel,
      }, 'income_tax');
    } else if (category === 'ibbi') {
      saveAndNavigate({
        clientType: 'organisation',
        organisationTemplate: 'IBBI_IVS',
        institutionCategory: categoryLabel,
      }, 'ibbi');
    } else {
      setSelectedCategory(category);
      setShowBankList(true);
    }
  }, [projectId, initialFields]);

  const handleBackFromBanks = useCallback(() => {
    setShowBankList(false);
    setSelectedCategory(null);
  }, []);

  const handleResetWizard = useCallback(async () => {
    if (confirm('Are you sure you want to change report parameters? This will permanently clear all your typed data and reset the report.')) {
      const clearedFields = { ...DEFAULT_FIELDS } as ReportFields;
      try {
        await saveReportDraft(projectId, clearedFields);
      } catch (e) {
        console.error(e);
      }
      setBuilder('wizard');
      setWizardStep('setup');
      setSelectingOrg(false);
      setSelectedCategory(null);
      setShowBankList(false);
      setSelectedBank(null);
      setShowSubList(false);
    }
  }, [projectId]);

  if (builder === 'wizard') {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-8 rounded-2xl border border-neutral-200">
        <div className={`${selectingOrg} ? 'max-w-5xl' : 'max-w-2xl'} w-full text-center space-y-8 transition-all duration-300`}>
          <div>
            <h2 className="text-3xl font-extrabold text-[#0f2038] tracking-tight">
              Draft New Valuation Report
            </h2>
            <p className="text-[#6c757d] mt-2 text-base">
              Set up the report parameters for Project <span className="font-mono font-bold text-[#b8860b]">{projectCode}</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className={\`w-2.5 h-2.5 rounded-full \${wizardStep === 'setup' ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}\`}></span>
              <span className={\`w-8 h-[2px] \${wizardStep === 'completed' ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}\`}></span>
              <span className={\`w-2.5 h-2.5 rounded-full \${wizardStep === 'completed' ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}\`}></span>
            </div>
          </div>

          {!selectingOrg ? (
            <div className="grid md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => handleSelectClientType('individual')}
                className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-[#b8860b] shadow-lg hover:shadow-xl transition-all duration-300 group text-center w-full"
              >
                <div className="w-16 h-16 rounded-full bg-[#fcf8ee] flex items-center justify-center mb-5 text-[#b8860b] group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0f2038] mb-2">Individual Client</h3>
                <p className="text-sm text-[#6c757d]">
                  Generate a standard valuation report formatted for individual owners and standard purposes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectClientType('organisation')}
                className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-[#b8860b] shadow-lg hover:shadow-xl transition-all duration-300 group text-center w-full"
              >
                <div className="w-16 h-16 rounded-full bg-[#e8f0f8] flex items-center justify-center mb-5 text-[#0f2038] group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0f2038] mb-2">Organisation / Bank</h3>
                <p className="text-sm text-[#6c757d]">
                  Select an institutional layout mapped to specific banking and credit organisation requirements.
                </p>
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e9ecef] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e9ecef]">
                <h3 className="text-lg font-bold text-[#0f2038]">
                  {showBankList ? 'Select Bank / Institution' : 'Select Institution Category'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (showBankList) {
                      handleBackFromBanks();
                    } else {
                      setSelectingOrg(false);
                    }
                  }}
                  className="text-sm text-[#b8860b] hover:text-[#8a6507] font-medium"
                >
                  ← Back
                </button>
              </div>

              {showBankList && selectedCategory ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto p-3 border border-[#dee2e6] rounded-xl bg-neutral-50/50">
                  {selectedCategory && (
                    <>
                      {selectedBank && !showSubList && (
                        <button
                          type="button"
                          onClick={() => handleSelectOrganisation(selectedBank)}
                          className="p-4 rounded-xl border-2 border-[#b8860b] bg-[#fffbf0] text-center transition-all duration-200 flex flex-col items-center gap-2"
                        >
                          <span className="text-sm font-bold text-[#0f2038]">{selectedBank}</span>
                        </button>
                      )}
                      {showSubList && selectedBank ? (
                        <div className="col-span-full">
                          <p className="text-sm font-bold text-[#0f2038] mb-3">Select Sub-Template for {selectedBank}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {[1, 2, 3].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleSelectSubTemplate(`Sub Template ${num}`)}
                                className="p-4 rounded-xl border border-[#dee2e6] hover:border-[#b8860b] hover:bg-[#fffbf0] text-center transition-all duration-200 flex flex-col items-center gap-2"
                              >
                                <span className="text-sm font-bold text-[#0f2038]">Sub Template {num}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {['Bank A', 'Bank B', 'Bank C', 'Bank D', 'Bank E'].map((bank) => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => handleSelectOrganisation(bank)}
                              className="p-4 rounded-xl border border-[#dee2e6] hover:border-[#b8860b] hover:bg-[#fffbf0] text-center transition-all duration-200 flex flex-col items-center gap-2"
                            >
                              <span className="text-sm font-bold text-[#0f2038]">{bank}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'bank_fis', label: 'Bank & FIS', icon: '🏦' },
                    { id: 'apf', label: 'Advance Processing Facility', icon: '💼' },
                    { id: 'cf', label: 'Construction Funding', icon: '🏗️' },
                    { id: 'income_tax', label: 'Income Tax Capital Gain', icon: '📊' },
                    { id: 'ibbi', label: 'IBBI - IVS', icon: '⚖️' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.id)}
                      className="p-4 rounded-xl border border-[#dee2e6] hover:border-[#b8860b] hover:bg-[#fffbf0] text-center transition-all duration-200 flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-[#0f2038] leading-tight">{cat.label}</span>
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

  if (builder === 'ibbi') {
    return (
      <IBBIReportBuilder
        projectId={projectId}
        projectCode={projectCode}
        initialFields={initialFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
      />
    );
  }

  if (builder === 'income_tax') {
    return (
      <IncomeTaxReportBuilder
        projectId={projectId}
        projectCode={projectCode}
        initialFields={initialFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
      />
    );
  }

  return (
    <GeneralReportBuilder
      projectId={projectId}
      projectCode={projectCode}
      initialFields={initialFields}
      status={status}
      userRole={userRole}
      bucketImages={bucketImages}
      prefill={prefill}
      onWizardComplete={() => setBuilder('general')}
      onNavigateToBuilder={(target) => setBuilder(target)}
      onResetWizard={handleResetWizard}
    />
  );
}
