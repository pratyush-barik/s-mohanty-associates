'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ICICI_BANK_NPA_CONFIG: BankConfig = {
  bankId: 'ICICI BANK',
  subTemplateId: 'NPA',
  displayName: 'ICICI Bank — NPA Recovery Format',
  defaultValues: {
    purpose: 'SARFAESI / NPA Recovery / Distress Valuation',
  },
};

export default function ICICIBankNPA(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ICICI_BANK_NPA_CONFIG} {...props} />;
}
