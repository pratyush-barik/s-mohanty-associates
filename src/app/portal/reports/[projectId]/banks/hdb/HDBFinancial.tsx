'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const HDB_FINANCIAL_CONFIG: BankConfig = {
  bankId: 'HDB FINANCIAL SERVICES',
  subTemplateId: '',
  displayName: 'HDB Financial Services',
  defaultValues: {
    purpose: 'Mortgage / Loan Against Property',
  },
};

export default function HDBFinancial(props: BankReportBuilderProps) {
  return <BankReportBuilder config={HDB_FINANCIAL_CONFIG} {...props} />;
}
