'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const MAHINDRA_FINANCE_CONFIG: BankConfig = {
  bankId: 'MAHINDRA FINANCE LTD',
  subTemplateId: '',
  displayName: 'Mahindra & Mahindra Financial Services Ltd',
  defaultValues: {
    purpose: 'Housing / SME / Commercial Asset Valuation',
  },
};

export default function MahindraFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={MAHINDRA_FINANCE_CONFIG} {...props} />;
}
