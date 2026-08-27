'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const UCO_BANK_CONFIG: BankConfig = {
  bankId: 'UCO BANK',
  subTemplateId: '',
  displayName: 'UCO Bank',
  defaultValues: {
    purpose: 'Housing Loan / Commercial Mortgage / Loan Against Property',
  },
};

export default function UCOBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={UCO_BANK_CONFIG} {...props} />;
}
