'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const SMFG_FULLERTON_CONFIG: BankConfig = {
  bankId: 'SMFG INDIA-FULLERTON',
  subTemplateId: '',
  displayName: 'SMFG India Credit (Fullerton India)',
  defaultValues: {
    purpose: 'Housing Loan / Loan Against Property',
  },
};

export default function SMFGIndiaFullerton(props: BankReportBuilderProps) {
  return <BankReportBuilder config={SMFG_FULLERTON_CONFIG} {...props} />;
}
