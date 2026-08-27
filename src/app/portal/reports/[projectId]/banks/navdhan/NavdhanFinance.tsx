'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const NAVDHAN_FINANCE_CONFIG: BankConfig = {
  bankId: 'NAVDHAN FINANCE',
  subTemplateId: '',
  displayName: 'Navdhan Finance',
  defaultValues: {
    purpose: 'Rural & MSME Lending',
  },
};

export default function NavdhanFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={NAVDHAN_FINANCE_CONFIG} {...props} />;
}
