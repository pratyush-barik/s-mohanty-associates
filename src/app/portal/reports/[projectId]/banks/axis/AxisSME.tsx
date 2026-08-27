'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AXIS_SME_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'SME',
  displayName: 'Axis Bank — SME Banking',
  defaultValues: {
    purpose: 'SME Working Capital / Collateral Security Valuation',
  },
};

export default function AxisSME(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_SME_CONFIG} {...props} />;
}
