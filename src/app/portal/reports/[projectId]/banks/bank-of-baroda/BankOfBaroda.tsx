'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const BANK_OF_BARODA_CONFIG: BankConfig = {
  bankId: 'BANK OF BARODA-BOB',
  subTemplateId: '',
  displayName: 'Bank of Baroda (BOB)',
  defaultValues: {
    purpose: 'Mortgage / Housing Loan / Term Loan',
  },
};

export default function BankOfBaroda(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANK_OF_BARODA_CONFIG} {...props} />;
}
