'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const SBI_CONFIG: BankConfig = {
  bankId: 'STATE BANK OF INDIA-SBI',
  subTemplateId: '',
  displayName: 'State Bank of India (SBI)',
  defaultValues: {
    purpose: 'Home Loan / Mortgage / Commercial Lending',
  },
};

export default function StateBankOfIndia(props: BankReportBuilderProps) {
  return <BankReportBuilder config={SBI_CONFIG} {...props} />;
}
