'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const AXIS_AGRI_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'AGRI',
  displayName: 'Axis Bank — AGRI',
  defaultValues: {
    purpose: 'Agriculture Loan / Land Valuation',
  },
};

export default function AxisAGRI(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_AGRI_CONFIG} {...props} />;
}
