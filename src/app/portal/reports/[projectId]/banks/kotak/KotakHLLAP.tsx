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
  const [category, setCategory] = useState<KotakHLLAPCategory>(() => {
    const rawCat = props.initialFields?.kotakHllapCategory as KotakHLLAPCategory;
    if (rawCat && ['FLAT', 'IND', 'L&B', 'RES-COM', 'VL'].includes(rawCat)) {
      return rawCat;
    }
    return 'FLAT';
  });

  const handleCategoryChange = (newCat: KotakHLLAPCategory) => {
    setCategory(newCat);
  };

  switch (category) {
    case 'IND':
      return <KotakHLLAPIndustrial {...props} onCategoryChange={handleCategoryChange} />;
    case 'L&B':
      return <KotakHLLAPLandAndBuilding {...props} onCategoryChange={handleCategoryChange} />;
    case 'RES-COM':
      return <KotakHLLAPResiCumComm {...props} onCategoryChange={handleCategoryChange} />;
    case 'VL':
      return <KotakHLLAPVacantLand {...props} onCategoryChange={handleCategoryChange} />;
    case 'FLAT':
    default:
      return <KotakHLLAPFlat {...props} onCategoryChange={handleCategoryChange} />;
  }
}
