'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const VARTHANA_FINANCE_CONFIG: BankConfig = {
  bankId: 'VARTHANA FINANCE',
  subTemplateId: '',
  displayName: 'Varthana Finance (School Loans)',
  defaultValues: {
    purpose: 'School & Educational Institution Infrastructure Valuation',
  },
};

export default function VarthanaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={VARTHANA_FINANCE_CONFIG} {...props} />;
}
