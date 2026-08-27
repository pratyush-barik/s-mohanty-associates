'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const PROTEUM_FINANCE_CONFIG: BankConfig = {
  bankId: 'PROTEUM FINANCE',
  subTemplateId: '',
  displayName: 'Proteum Finance',
  defaultValues: {
    purpose: 'Mortgage / Financial Valuation',
  },
};

export default function ProteumFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={PROTEUM_FINANCE_CONFIG} {...props} />;
}
