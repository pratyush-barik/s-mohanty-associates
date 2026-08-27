'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ARKA_FINANCE_CONFIG: BankConfig = {
  bankId: 'ARKA FINANCE LTD',
  subTemplateId: '',
  displayName: 'Arka Finance Ltd',
};

export default function ArkaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ARKA_FINANCE_CONFIG} {...props} />;
}
