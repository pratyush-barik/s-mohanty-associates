'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const JANA_SMALL_FINANCE_BANK_CONFIG: BankConfig = {
  bankId: 'JANA SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Jana Small Finance Bank',
  defaultValues: {
    purpose: 'Affordable Housing / MSME Loan',
  },
};

export default function JanaSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={JANA_SMALL_FINANCE_BANK_CONFIG} {...props} />;
}
