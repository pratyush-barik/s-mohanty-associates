'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const IDBI_BANK_CONFIG: BankConfig = {
  bankId: 'IDBI BANK',
  subTemplateId: '',
  displayName: 'IDBI Bank',
  defaultValues: {
    purpose: 'Housing Loan / Commercial / Project Finance',
  },
};

export default function IDBIBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={IDBI_BANK_CONFIG} {...props} />;
}
