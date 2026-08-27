'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AXIS_HLLAP_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Axis Bank — HL-LAP',
  defaultValues: {
    purpose: 'Home Loan / LAP',
  },
};

export default function AxisHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_HLLAP_CONFIG} {...props} />;
}
