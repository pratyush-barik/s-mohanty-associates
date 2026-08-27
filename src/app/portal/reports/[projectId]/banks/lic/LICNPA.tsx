'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LIC_NPA_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'NPA-DEFAULT CASES',
  displayName: 'LIC Housing Finance Ltd — NPA Default Cases',
  defaultValues: {
    purpose: 'SARFAESI / NPA Default Case Valuation',
  },
};

export default function LICNPA(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LIC_NPA_CONFIG} {...props} />;
}
