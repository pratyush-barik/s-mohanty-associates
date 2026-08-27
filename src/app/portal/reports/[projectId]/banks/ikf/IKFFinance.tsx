'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const IKF_FINANCE_CONFIG: BankConfig = {
  bankId: 'IKF FINANCE',
  subTemplateId: '',
  displayName: 'IKF Finance',
  defaultValues: {
    purpose: 'Mortgage / MSME Loan',
  },
};

export default function IKFFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={IKF_FINANCE_CONFIG} {...props} />;
}
