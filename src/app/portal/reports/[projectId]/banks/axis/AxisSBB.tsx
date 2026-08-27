'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AXIS_SBB_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'SBB',
  displayName: 'Axis Bank — SBB (Small Business Banking)',
  defaultValues: {
    purpose: 'Small Business Banking Security Valuation',
  },
};

export default function AxisSBB(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_SBB_CONFIG} {...props} />;
}
