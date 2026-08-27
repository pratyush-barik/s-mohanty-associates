'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const UJJIVAN_CONFIG: BankConfig = {
  bankId: 'UJJIVAN SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Ujjivan Small Finance Bank',
  defaultValues: {
    purpose: 'Affordable Housing / Micro Mortgages',
  },
};

export default function UjjivanSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={UJJIVAN_CONFIG} {...props} />;
}
