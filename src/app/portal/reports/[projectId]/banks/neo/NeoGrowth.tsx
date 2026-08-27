'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const NEO_GROWTH_CONFIG: BankConfig = {
  bankId: 'NEO GROWTH',
  subTemplateId: '',
  displayName: 'NeoGrowth Credit Pvt Ltd',
  defaultValues: {
    purpose: 'Business Loan / Collateral Valuation',
  },
};

export default function NeoGrowth(props: BankReportBuilderProps) {
  return <BankReportBuilder config={NEO_GROWTH_CONFIG} {...props} />;
}
