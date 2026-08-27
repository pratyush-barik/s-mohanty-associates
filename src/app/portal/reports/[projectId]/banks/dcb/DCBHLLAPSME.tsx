'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const DCB_HL_LAP_SME_CONFIG: BankConfig = {
  bankId: 'DCB BANK',
  subTemplateId: 'HL-LAP-SME',
  displayName: 'DCB Bank — HL-LAP-SME',
  defaultValues: {
    purpose: 'Home Loan / LAP / SME Finance',
  },
};

export default function DCBHLLAPSME(props: BankReportBuilderProps) {
  return <BankReportBuilder config={DCB_HL_LAP_SME_CONFIG} {...props} />;
}
