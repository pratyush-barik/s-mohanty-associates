'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const CANARA_BANK_CONFIG: BankConfig = {
  bankId: 'CANARA BANK',
  subTemplateId: '',
  displayName: 'Canara Bank',
  defaultValues: {
    purpose: 'Housing Loan / Mortgage / Commercial Loan',
  },
};

export default function CanaraBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CANARA_BANK_CONFIG} {...props} />;
}
