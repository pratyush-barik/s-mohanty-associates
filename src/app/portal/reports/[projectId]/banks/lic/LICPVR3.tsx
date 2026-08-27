'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LIC_PVR3_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-3(LAP-RENNOVATION-BOTH L&B-FLAT)',
  displayName: 'LIC Housing Finance Ltd — PVR-3 (LAP / Renovation)',
  defaultValues: {
    purpose: 'LAP / Renovation Valuation (PVR-3)',
  },
};

export default function LICPVR3(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LIC_PVR3_CONFIG} {...props} />;
}
