'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const UTKARSH_CONFIG: BankConfig = {
  bankId: 'UTKARSH SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Utkarsh Small Finance Bank',
  defaultValues: {
    purpose: 'Housing Loan / Micro Mortgages',
  },
};

export default function UtkarshSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={UTKARSH_CONFIG} {...props} />;
}
