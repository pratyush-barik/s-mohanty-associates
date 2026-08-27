'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const CLIX_CAPITAL_CONFIG: BankConfig = {
  bankId: 'CLIX CAPITAL LTD',
  subTemplateId: '',
  displayName: 'Clix Capital Ltd',
  defaultValues: {
    purpose: 'Mortgage / Business Finance',
  },
};

export default function ClixCapital(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CLIX_CAPITAL_CONFIG} {...props} />;
}
