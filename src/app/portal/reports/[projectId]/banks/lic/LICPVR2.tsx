'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LIC_PVR2_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-2(FLAT-UNDERCONSTRUCTION)',
  displayName: 'LIC Housing Finance Ltd — PVR-2 (Flat Under Construction)',
  defaultValues: {
    purpose: 'Flat Under Construction Valuation (PVR-2)',
    valuationLayout: 'apartment',
  },
};

export default function LICPVR2(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LIC_PVR2_CONFIG} {...props} />;
}
