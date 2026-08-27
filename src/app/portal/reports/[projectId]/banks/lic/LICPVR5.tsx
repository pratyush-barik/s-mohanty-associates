'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LIC_PVR5_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-5 (SUBSEQUENT VALUATION REPORT)',
  displayName: 'LIC Housing Finance Ltd — PVR-5 (Subsequent Valuation Report)',
  defaultValues: {
    purpose: 'Subsequent Progress / Stage Valuation (PVR-5)',
  },
};

export default function LICPVR5(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LIC_PVR5_CONFIG} {...props} />;
}
