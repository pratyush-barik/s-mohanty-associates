'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const INDIAN_BANK_CONFIG: BankConfig = {
  bankId: 'INDIAN BANK',
  subTemplateId: '',
  displayName: 'Indian Bank',
  defaultValues: {
    purpose: 'Housing Loan / Commercial Mortgage',
  },
};

export default function IndianBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={INDIAN_BANK_CONFIG} {...props} />;
}
