'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ADITYA_BIRLA_CAPITAL_MLAP_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA CAPITAL LTD',
  subTemplateId: 'MLAP',
  displayName: 'Aditya Birla Capital Ltd — MLAP',
  defaultValues: {
    purpose: 'Mortgage Loan Against Property (MLAP)',
    branchName: 'MLAP',
  },
};

export default function AdityaBirlaCapitalMLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_CAPITAL_MLAP_CONFIG} {...props} />;
}
