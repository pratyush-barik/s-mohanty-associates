'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AU_SMALL_FINANCE_BANK_CONFIG: BankConfig = {
  bankId: 'AU SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'AU Small Finance Bank',
  defaultValues: {
    purpose: 'Mortgage / Home Loan',
  },
};

export default function AUSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AU_SMALL_FINANCE_BANK_CONFIG} {...props} />;
}
