'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LT_FINANCIAL_CONFIG: BankConfig = {
  bankId: 'L&T FINANCIAL SERVICES',
  subTemplateId: '',
  displayName: 'L&T Financial Services',
  defaultValues: {
    purpose: 'Housing Finance / Infrastructure / Micro Loans',
  },
};

export default function LTFinancialServices(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LT_FINANCIAL_CONFIG} {...props} />;
}
