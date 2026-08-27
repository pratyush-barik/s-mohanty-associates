'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const LIC_PVR1_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-1(SELF CONSTRUCTIONLA-L & B)',
  displayName: 'LIC Housing Finance Ltd — PVR-1 (Self Construction L & B)',
  defaultValues: {
    purpose: 'Self Construction / Land & Building Valuation (PVR-1)',
  },
};

export default function LICPVR1(props: BankReportBuilderProps) {
  return <BankReportBuilder config={LIC_PVR1_CONFIG} {...props} />;
}
