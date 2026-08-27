'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ADITYA_BIRLA_CAPITAL_STSL_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA CAPITAL LTD',
  subTemplateId: 'STSL',
  displayName: 'Aditya Birla Capital Ltd — STSL',
  fieldLabels: {
    ownerName: 'Name of the Client',
    ownerAddress: 'Property Address as Per TRF',
    branchName: 'Vertical',
  },
  extraFields: {
    'section-1': [
      { key: 'vertical', label: 'Vertical', default: 'STSL', readOnly: true },
      { key: 'caseReferenceNumber', label: 'Case Reference Number' },
      { key: 'propertyOwnerName', label: 'Name of the Property Owner' },
      { key: 'initiationDate', label: 'Initiation Date', type: 'date' },
      { key: 'propertyAddressAsVisit', label: 'Property Address as Per Visit', type: 'textarea', span: 2 },
      { key: 'propertyAddressAsDocs', label: 'Property Address as Per "Docs"', type: 'textarea', span: 2 },
      { key: 'mainLocality', label: 'Main Locality' },
      { key: 'subLocality', label: 'Sub Locality' },
      { key: 'microLocation', label: 'Micro Location' },
      { key: 'valuedBefore', label: 'Has Valuator Done Valuation Before?', type: 'yesno' },
      { key: 'valuedBeforeDate', label: 'If yes, when' },
      { key: 'propertySubType', label: 'Property Sub Type' },
    ],
  },
  defaultValues: {
    branchName: 'STSL',
  },
};

export default function AdityaBirlaCapitalSTSL(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_CAPITAL_STSL_CONFIG} {...props} />;
}
