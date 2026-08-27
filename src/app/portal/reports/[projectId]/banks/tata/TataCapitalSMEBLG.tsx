'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const TATA_CAPITAL_SME_BLG_CONFIG: BankConfig = {
  bankId: 'TATA CAPITAL LTD',
  subTemplateId: 'SME-BLG',
  displayName: 'Tata Capital Ltd — SME-BLG',
  defaultValues: {
    purpose: 'SME / Business Loan Group Valuation',
  },
};

export default function TataCapitalSMEBLG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={TATA_CAPITAL_SME_BLG_CONFIG} {...props} />;
}
