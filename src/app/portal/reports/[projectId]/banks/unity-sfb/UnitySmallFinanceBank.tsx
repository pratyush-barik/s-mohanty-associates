'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const UNITY_SFB_CONFIG: BankConfig = {
  bankId: 'UNITY SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Unity Small Finance Bank',
  defaultValues: {
    purpose: 'Housing Loan / Business Finance',
  },
};

export default function UnitySmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={UNITY_SFB_CONFIG} {...props} />;
}
