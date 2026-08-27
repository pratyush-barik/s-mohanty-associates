'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const KOTAK_HLLAP_CONFIG: BankConfig = {
  bankId: 'KOTAK MAHINDRA BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Kotak Mahindra Bank — HL-LAP',
  defaultValues: {
    purpose: 'Home Loan / LAP',
  },
};

export default function KotakHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={KOTAK_HLLAP_CONFIG} {...props} />;
}
