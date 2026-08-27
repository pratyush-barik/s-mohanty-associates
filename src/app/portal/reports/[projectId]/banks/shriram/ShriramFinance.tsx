'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const SHRIRAM_FINANCE_CONFIG: BankConfig = {
  bankId: 'SHRIRAM FINANCE',
  subTemplateId: '',
  displayName: 'Shriram Finance Ltd',
  defaultValues: {
    purpose: 'Housing Loan / Commercial / LAP',
  },
};

export default function ShriramFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={SHRIRAM_FINANCE_CONFIG} {...props} />;
}
