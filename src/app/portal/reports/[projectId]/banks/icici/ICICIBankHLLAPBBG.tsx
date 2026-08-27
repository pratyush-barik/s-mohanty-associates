'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ICICI_BANK_HL_LAP_BBG_CONFIG: BankConfig = {
  bankId: 'ICICI BANK',
  subTemplateId: 'HL-LAP-BBG',
  displayName: 'ICICI Bank — HL-LAP-BBG',
  defaultValues: {
    purpose: 'Home Loan / LAP / Business Banking Group',
  },
};

export default function ICICIBankHLLAPBBG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ICICI_BANK_HL_LAP_BBG_CONFIG} {...props} />;
}
