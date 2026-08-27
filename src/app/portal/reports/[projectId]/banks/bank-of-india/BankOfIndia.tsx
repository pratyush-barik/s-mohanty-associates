'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const BANK_OF_INDIA_CONFIG: BankConfig = {
  bankId: 'BANK OF INDIA-BOI',
  subTemplateId: '',
  displayName: 'Bank of India (BOI)',
  defaultValues: {
    purpose: 'Mortgage / Housing Loan / Collateral Security',
  },
};

export default function BankOfIndia(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANK_OF_INDIA_CONFIG} {...props} />;
}
