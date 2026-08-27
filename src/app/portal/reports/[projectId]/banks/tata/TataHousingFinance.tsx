'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const TATA_HOUSING_FINANCE_CONFIG: BankConfig = {
  bankId: 'TATA HOUSING FINANCE LTD',
  subTemplateId: '',
  displayName: 'Tata Capital Housing Finance Ltd',
  defaultValues: {
    purpose: 'Housing Loan / Mortgage / Construction Finance',
  },
};

export default function TataHousingFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={TATA_HOUSING_FINANCE_CONFIG} {...props} />;
}
