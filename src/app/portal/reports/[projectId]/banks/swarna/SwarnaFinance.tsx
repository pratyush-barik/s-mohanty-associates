'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const SWARNA_FINANCE_CONFIG: BankConfig = {
  bankId: 'SWARNA FINANCE',
  subTemplateId: '',
  displayName: 'Swarna Finance',
  defaultValues: {
    purpose: 'Mortgage / Financial Valuation',
  },
};

export default function SwarnaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={SWARNA_FINANCE_CONFIG} {...props} />;
}
