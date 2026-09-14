'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AYE_FINANCE_CONFIG: BankConfig = {
  bankId: 'AYE FINANCE LTD',
  subTemplateId: '',
  displayName: 'Aye Finance Ltd',
};

export default function AyeFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AYE_FINANCE_CONFIG} {...props} />;
}

