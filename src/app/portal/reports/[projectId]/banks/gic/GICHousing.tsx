'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const GIC_HOUSING_CONFIG: BankConfig = {
  bankId: 'GIC HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'GIC Housing Finance Ltd',
  defaultValues: {
    purpose: 'Housing Loan Valuation',
  },
};

export default function GICHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GIC_HOUSING_CONFIG} {...props} />;
}
