'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const GRIHAM_HOUSING_CONFIG: BankConfig = {
  bankId: 'GRIHAM HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'Griham Housing Finance',
  defaultValues: {
    purpose: 'Housing Loan / Mortgage',
  },
};

export default function GrihamHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GRIHAM_HOUSING_CONFIG} {...props} />;
}
