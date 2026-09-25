'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const CANFIN_HOMES_CONFIG: BankConfig = {
  bankId: 'CANFIN HOMES LTD',
  subTemplateId: '',
  displayName: 'CanFin Homes Ltd',
  defaultValues: {
    purpose: 'Housing Loan / Composite Loan',
  },
  getPDFRenderer: (data, projectCode) => {
    const { PDFCanFinHomesRenderer } = require('@/lib/banks/pdf-canfin-homes-renderer');
    return new PDFCanFinHomesRenderer(data, projectCode, false);
  },
};

export default function CanFinHomes(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CANFIN_HOMES_CONFIG} {...props} />;
}
