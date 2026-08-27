'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const BANDHAN_HLLAP_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Bandhan Bank — HL-LAP',
  defaultValues: {
    purpose: 'Home Loan / LAP',
  },
};

export default function BandhanHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANDHAN_HLLAP_CONFIG} {...props} />;
}
