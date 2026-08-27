'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const SAMMUNATI_FINANCE_CONFIG: BankConfig = {
  bankId: 'SAMMUNATI FINANCE',
  subTemplateId: '',
  displayName: 'Sammunati Financial Intermediation & Services Pvt Ltd',
  defaultValues: {
    purpose: 'Agri-Commerce / Warehouse / Land Valuation',
  },
};

export default function SammunatiFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={SAMMUNATI_FINANCE_CONFIG} {...props} />;
}
