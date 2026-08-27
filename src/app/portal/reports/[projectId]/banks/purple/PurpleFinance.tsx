'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const PURPLE_FINANCE_CONFIG: BankConfig = {
  bankId: 'PURPLE FINANCE',
  subTemplateId: '',
  displayName: 'Purple Finance Ltd',
  defaultValues: {
    purpose: 'Mortgage / MSME Finance',
  },
};

export default function PurpleFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={PURPLE_FINANCE_CONFIG} {...props} />;
}
