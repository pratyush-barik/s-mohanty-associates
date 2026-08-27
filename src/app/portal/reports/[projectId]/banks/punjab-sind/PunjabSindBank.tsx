'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const PUNJAB_SIND_BANK_CONFIG: BankConfig = {
  bankId: 'PUNJAB & SIND BANK',
  subTemplateId: '',
  displayName: 'Punjab & Sind Bank',
  defaultValues: {
    purpose: 'Housing Loan / Mortgage / Working Capital',
  },
};

export default function PunjabSindBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={PUNJAB_SIND_BANK_CONFIG} {...props} />;
}
