'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const DCB_DESKTOP_CONFIG: BankConfig = {
  bankId: 'DCB BANK',
  subTemplateId: 'Desktop valuation format',
  displayName: 'DCB Bank — Desktop Valuation Format',
  defaultValues: {
    purpose: 'Desktop Valuation / Interim Review',
  },
};

export default function DCBDesktop(props: BankReportBuilderProps) {
  return <BankReportBuilder config={DCB_DESKTOP_CONFIG} {...props} />;
}
