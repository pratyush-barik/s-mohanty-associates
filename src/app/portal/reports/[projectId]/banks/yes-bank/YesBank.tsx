'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const YES_BANK_CONFIG: BankConfig = {
  bankId: 'YES BANK',
  subTemplateId: '',
  displayName: 'Yes Bank',
  defaultValues: {
    purpose: 'Housing Loan / Commercial / Project Loan',
  },
};

export default function YesBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={YES_BANK_CONFIG} {...props} />;
}
