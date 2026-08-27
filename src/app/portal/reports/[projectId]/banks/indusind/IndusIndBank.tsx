'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const INDUSIND_BANK_CONFIG: BankConfig = {
  bankId: 'INDUSIND BANK',
  subTemplateId: '',
  displayName: 'IndusInd Bank',
  defaultValues: {
    purpose: 'Mortgage / Housing Loan / Commercial Finance',
  },
};

export default function IndusIndBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={INDUSIND_BANK_CONFIG} {...props} />;
}
