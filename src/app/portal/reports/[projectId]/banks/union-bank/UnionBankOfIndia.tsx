'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const UNION_BANK_CONFIG: BankConfig = {
  bankId: 'UNION BANK OF INDIA-UBI',
  subTemplateId: '',
  displayName: 'Union Bank of India (UBI)',
  defaultValues: {
    purpose: 'Housing Loan / Mortgage / Commercial Lending',
  },
};

export default function UnionBankOfIndia(props: BankReportBuilderProps) {
  return <BankReportBuilder config={UNION_BANK_CONFIG} {...props} />;
}
