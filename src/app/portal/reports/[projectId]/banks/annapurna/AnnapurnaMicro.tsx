'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ANNAPURNA_MICRO_CONFIG: BankConfig = {
  bankId: 'ANNAPURNA MICRO FINANCE LTD',
  subTemplateId: '',
  displayName: 'Annapurna Micro Finance Ltd',
  defaultValues: {
    purpose: 'Micro Finance / MSME Loan',
  },
};

export default function AnnapurnaMicro(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ANNAPURNA_MICRO_CONFIG} {...props} />;
}
