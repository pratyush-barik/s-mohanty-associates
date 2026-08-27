'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const HDFC_BANK_HL_LAP_BLG_CONFIG: BankConfig = {
  bankId: 'HDFC BANK',
  subTemplateId: 'HL-LAP-BLG',
  displayName: 'HDFC Bank — HL-LAP-BLG',
  defaultValues: {
    purpose: 'Home Loan / LAP / Business Loan Group',
  },
};

export default function HDFCBankHLLAPBLG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={HDFC_BANK_HL_LAP_BLG_CONFIG} {...props} />;
}
