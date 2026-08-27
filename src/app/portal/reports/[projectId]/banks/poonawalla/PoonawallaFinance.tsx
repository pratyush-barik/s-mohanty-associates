'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const POONAWALLA_FINANCE_CONFIG: BankConfig = {
  bankId: 'POONAWALLA FINANCE',
  subTemplateId: '',
  displayName: 'Poonawalla Fincorp Ltd',
  defaultValues: {
    purpose: 'Mortgage / Business Finance / LAP',
  },
};

export default function PoonawallaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={POONAWALLA_FINANCE_CONFIG} {...props} />;
}
