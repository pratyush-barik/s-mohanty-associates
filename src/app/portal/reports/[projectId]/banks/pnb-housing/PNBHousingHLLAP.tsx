'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const PNB_HOUSING_HL_LAP_CONFIG: BankConfig = {
  bankId: 'PNB HOUSING FINANCE LTD',
  subTemplateId: 'HL-LAP',
  displayName: 'PNB Housing Finance Ltd — HL-LAP',
  defaultValues: {
    purpose: 'Housing Loan / Loan Against Property',
  },
};

export default function PNBHousingHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={PNB_HOUSING_HL_LAP_CONFIG} {...props} />;
}
