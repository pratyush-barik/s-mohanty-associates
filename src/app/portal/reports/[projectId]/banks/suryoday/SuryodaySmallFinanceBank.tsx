'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const SURYODAY_CONFIG: BankConfig = {
  bankId: 'SURYODAY SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Suryoday Small Finance Bank',
  defaultValues: {
    purpose: 'Affordable Housing / MSME Finance',
  },
};

export default function SuryodaySmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={SURYODAY_CONFIG} {...props} />;
}
