'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const MANAPPURAM_HOUSING_CONFIG: BankConfig = {
  bankId: 'MANAPPURAM HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'Manappuram Home Finance Ltd',
  defaultValues: {
    purpose: 'Affordable Housing Loan / LAP',
  },
};

export default function ManappuramHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={MANAPPURAM_HOUSING_CONFIG} {...props} />;
}
