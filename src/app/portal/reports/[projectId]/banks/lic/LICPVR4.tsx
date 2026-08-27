'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LIC_PVR4_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-4(LAND PURCHSASE ONLY)',
  displayName: 'LIC Housing Finance Ltd — PVR-4 (Land Purchase Only)',
  defaultValues: {
    purpose: 'Land Purchase Only Valuation (PVR-4)',
  },
  hiddenSections: ['section-7'], // No building valuation for land purchase only
};

export default function LICPVR4(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LIC_PVR4_CONFIG} {...props} />;
}
