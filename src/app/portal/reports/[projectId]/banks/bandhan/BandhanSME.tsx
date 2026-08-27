'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const BANDHAN_SME_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'SME',
  displayName: 'Bandhan Bank — SME Banking',
  defaultValues: {
    purpose: 'SME Business Banking Valuation',
  },
};

export default function BandhanSME(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANDHAN_SME_CONFIG} {...props} />;
}
