'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ARTHAN_FINANCE_CONFIG: BankConfig = {
  bankId: 'ARTHAN FINANCE',
  subTemplateId: '',
  displayName: 'Arthan Finance',
};

export default function ArthanFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ARTHAN_FINANCE_CONFIG} {...props} />;
}
