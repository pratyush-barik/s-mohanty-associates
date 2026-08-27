'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const IDFC_FIRST_BANK_CONFIG: BankConfig = {
  bankId: 'IDFC FIRST BANK',
  subTemplateId: '',
  displayName: 'IDFC FIRST Bank',
  defaultValues: {
    purpose: 'Home Loan / LAP / Commercial Loan',
  },
};

export default function IDFCFirstBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={IDFC_FIRST_BANK_CONFIG} {...props} />;
}
