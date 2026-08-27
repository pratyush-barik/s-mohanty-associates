'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ISFC_CONFIG: BankConfig = {
  bankId: 'ISFC',
  subTemplateId: '',
  displayName: 'Indian School Finance Company (ISFC)',
  defaultValues: {
    purpose: 'Institutional / School & College Property Valuation',
  },
};

export default function ISFC(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ISFC_CONFIG} {...props} />;
}
