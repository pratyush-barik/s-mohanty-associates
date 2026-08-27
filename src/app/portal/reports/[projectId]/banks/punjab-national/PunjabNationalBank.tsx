'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const PUNJAB_NATIONAL_BANK_CONFIG: BankConfig = {
  bankId: 'PUNJAB NATIONAL BANK',
  subTemplateId: '',
  displayName: 'Punjab National Bank (PNB)',
  defaultValues: {
    purpose: 'Housing Loan / Commercial / Project Loan',
  },
};

export default function PunjabNationalBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={PUNJAB_NATIONAL_BANK_CONFIG} {...props} />;
}
