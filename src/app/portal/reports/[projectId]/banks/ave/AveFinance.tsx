'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AVE_FINANCE_CONFIG: BankConfig = {
  bankId: 'AVE FINANCE LTD',
  subTemplateId: '',
  displayName: 'Ave Finance Ltd',
};

export default function AveFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AVE_FINANCE_CONFIG} {...props} />;
}
