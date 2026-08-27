'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const VISTAAR_FINANCE_CONFIG: BankConfig = {
  bankId: 'VISTAAR FINANCE',
  subTemplateId: '',
  displayName: 'Vistaar Financial Services Pvt Ltd',
  defaultValues: {
    purpose: 'MSME Loan Against Property',
  },
};

export default function VistaarFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={VISTAAR_FINANCE_CONFIG} {...props} />;
}
