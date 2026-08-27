'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const CHOLA_INVESTMENT_CONFIG: BankConfig = {
  bankId: 'CHOLAMANDALAM INVESTMENT COMPANY LTD',
  subTemplateId: '',
  displayName: 'Cholamandalam Investment and Finance Company Ltd',
  defaultValues: {
    purpose: 'Home Loan / LAP / Business Loan',
  },
};

export default function CholaInvestment(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CHOLA_INVESTMENT_CONFIG} {...props} />;
}
