'use client';

import React, { useState } from 'react';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import { KotakHLLAPCategory } from './KotakHLLAPTypes';
import KotakHLLAPFlat from './KotakHLLAPFlat';
import KotakHLLAPIndustrial from './KotakHLLAPIndustrial';
import KotakHLLAPLandAndBuilding from './KotakHLLAPLandAndBuilding';
import KotakHLLAPResiCumComm from './KotakHLLAPResiCumComm';
import KotakHLLAPVacantLand from './KotakHLLAPVacantLand';
import { PDFKotakHLLAPFlatRenderer } from '@/lib/banks/pdf-kotak-hllap-flat-renderer';
import { PDFKotakHLLAPIndustrialRenderer } from '@/lib/banks/pdf-kotak-hllap-industrial-renderer';
import { PDFKotakHLLAPLandBuildingRenderer } from '@/lib/banks/pdf-kotak-hllap-land-building-renderer';
import { PDFKotakHLLAPResiCommRenderer } from '@/lib/banks/pdf-kotak-hllap-resi-comm-renderer';
import { PDFKotakHLLAPVacantLandRenderer } from '@/lib/banks/pdf-kotak-hllap-vacant-land-renderer';
import { Building2, Factory, Home, Sparkles, Trees, ArrowRight } from 'lucide-react';
import { saveReportDraft } from '@/app/actions/project';

export const KOTAK_HLLAP_CATEGORIES: {
  id: KotakHLLAPCategory;
  label: string;
  subTemplate: string;
  desc: string;
  icon: any;
}[] = [
  {
    id: 'FLAT',
    label: 'Flat / Apartment',
    subTemplate: 'HL-LAP - Flat / Apartment',
    desc: 'Multi-storey residential flats and apartments',
    icon: Building2,
  },
  {
    id: 'IND',
    label: 'Industrial Property',
    subTemplate: 'HL-LAP - Industrial Property',
    desc: 'Industrial sheds, plots, factories, and warehouses',
    icon: Factory,
  },
  {
    id: 'L&B',
    label: 'Land & Building',
    subTemplate: 'HL-LAP - Land & Building',
    desc: 'Independent houses, villas, and residential plots with construction',
    icon: Home,
  },
  {
    id: 'RES-COM',
    label: 'Residential cum Commercial',
    subTemplate: 'HL-LAP - Residential cum Commercial',
    desc: 'Mixed-use residential + commercial properties',
    icon: Sparkles,
  },
  {
    id: 'VL',
    label: 'Vacant Land',
    subTemplate: 'HL-LAP - Vacant Land',
    desc: 'Vacant plots / land only without construction',
    icon: Trees,
  },
];

export const KOTAK_HLLAP_CONFIG: BankConfig = {
  bankId: 'KOTAK MAHINDRA BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Kotak Mahindra Bank — HL-LAP',
  defaultValues: {
    purpose: 'Housing Loan / LAP',
  },
  getPDFRenderer: (fields: any, projectCode?: string) => {
    const cat: KotakHLLAPCategory = fields?.kotakHllapCategory || 'FLAT';
    switch (cat) {
      case 'IND':
        return new PDFKotakHLLAPIndustrialRenderer({ ...fields, projectCode });
      case 'L&B':
        return new PDFKotakHLLAPLandBuildingRenderer({ ...fields, projectCode });
      case 'RES-COM':
        return new PDFKotakHLLAPResiCommRenderer({ ...fields, projectCode });
      case 'VL':
        return new PDFKotakHLLAPVacantLandRenderer({ ...fields, projectCode });
      case 'FLAT':
      default:
        return new PDFKotakHLLAPFlatRenderer({ ...fields, projectCode });
    }
  },
};

export default function KotakHLLAP(props: BankReportBuilderProps) {
  const initialCat = (props.initialFields?.kotakHllapCategory as KotakHLLAPCategory) || null;
  const [category, setCategory] = useState<KotakHLLAPCategory | null>(() => {
    if (initialCat && ['FLAT', 'IND', 'L&B', 'RES-COM', 'VL'].includes(initialCat)) {
      return initialCat;
    }
    const sub = ((props.initialFields?.organisationSubTemplate || '') as string).toUpperCase();
    if (sub.includes('IND') || sub.includes('INDUSTRIAL')) return 'IND';
    if (sub.includes('LAND') || sub.includes('L&B')) return 'L&B';
    if (sub.includes('RESI') || sub.includes('COMM')) return 'RES-COM';
    if (sub.includes('VACANT') || sub.includes('VL')) return 'VL';
    if (sub.includes('FLAT') || sub.includes('APARTMENT')) return 'FLAT';
    return null;
  });

  const handleSelectCategory = async (cat: KotakHLLAPCategory) => {
    setCategory(cat);
    const catObj = KOTAK_HLLAP_CATEGORIES.find((c) => c.id === cat);
    try {
      await saveReportDraft(props.projectId, {
        ...props.initialFields,
        kotakHllapCategory: cat,
        organisationSubTemplate: catObj?.subTemplate || `HL-LAP - ${catObj?.label || cat}`,
      });
    } catch (err) {
      console.error('Failed to save category draft:', err);
    }
  };

  // If no category is selected yet, show full-page selection cards
  if (!category) {
    return (
      <div className="w-full bg-[#f8f9fa] p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200 text-slate-900">
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Kotak Mahindra Bank • HL-LAP
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Select HL-LAP Property Category
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Choose the specific valuation format based on the property type. This configures the dedicated valuation methodology, measurements, and PDF renderer.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-stretch pt-2">
            {KOTAK_HLLAP_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className="flex-1 min-w-[240px] max-w-[320px] p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/30 hover:shadow-md transition-all duration-150 flex flex-col items-start text-left cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1">
                    {cat.desc}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:text-amber-700 mt-auto">
                    <span>Select Format</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={props.onResetWizard}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              ← Back to Bank Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  switch (category) {
    case 'IND':
      return <KotakHLLAPIndustrial {...props} />;
    case 'L&B':
      return <KotakHLLAPLandAndBuilding {...props} />;
    case 'RES-COM':
      return <KotakHLLAPResiCumComm {...props} />;
    case 'VL':
      return <KotakHLLAPVacantLand {...props} />;
    case 'FLAT':
    default:
      return <KotakHLLAPFlat {...props} />;
  }
}
