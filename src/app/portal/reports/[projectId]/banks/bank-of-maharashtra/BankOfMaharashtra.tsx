'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const BANK_OF_MAHARASHTRA_CONFIG: BankConfig = {
  bankId: 'BANK OF MAHARASHTRA-BOM',
  subTemplateId: '',
  displayName: 'Bank of Maharashtra (BOM)',
  defaultValues: {
    purpose: 'Mortgage / Housing Loan / Term Loan',
  },
};

export default function BankOfMaharashtra(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANK_OF_MAHARASHTRA_CONFIG} {...props} />;
}
