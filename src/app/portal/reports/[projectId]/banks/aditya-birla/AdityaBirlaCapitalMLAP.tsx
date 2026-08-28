'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ADITYA_BIRLA_CAPITAL_MLAP_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA CAPITAL LTD',
  subTemplateId: 'MLAP',
  displayName: 'Aditya Birla Capital Ltd — MLAP',
  fieldLabels: {
    ownerName: 'Name of the Client',
    ownerAddress: 'Property Address as Per TRF',
    branchName: 'Vertical',
    loanApplicationNo: 'Case Reference Number',
  },
  extraFields: {
    'section-1': [
      { key: 'vertical', label: 'Vertical', default: 'MLAP', readOnly: true },
      { key: 'caseReferenceNumber', label: 'Case Reference Number' },
      { key: 'propertyOwnerName', label: 'Name of the Property Owner' },
      { key: 'initiationDate', label: 'Initiation Date', type: 'date' },
      { key: 'propertyAddressAsVisit', label: 'Property Address as Per Visit', type: 'textarea', span: 2 },
      { key: 'propertyAddressAsDocs', label: 'Property Address as Per "Docs"', type: 'textarea', span: 2 },
      { key: 'mainLocality', label: 'Main Locality' },
      { key: 'subLocality', label: 'Sub Locality' },
      { key: 'microLocation', label: 'Micro Location' },
      { key: 'valuedBefore', label: 'Has Valuator Done Valuation for this property before?', type: 'yesno' },
      { key: 'valuedBeforeDate', label: 'If yes, when' },
      { key: 'propertySubType', label: 'Property Sub Type (e.g. Row House, Bungalow, Flat)' },
      { 
        key: 'localityDevelopment', 
        label: 'Locality Development Status', 
        type: 'select', 
        options: ['Well Developed', 'Developed', 'Developing', 'Under Developed'],
        default: 'Well Developed' 
      },
      { 
        key: 'propertyJurisdiction', 
        label: 'Property Falling Within', 
        type: 'select', 
        options: ['Municipal Corporation', 'Municipality', 'Gram Panchayat', 'Development Authority / BDA', 'NAC'],
        default: 'Municipal Corporation' 
      },
    ],
  },
  defaultValues: {
    purpose: 'Mortgage Loan Against Property (MLAP)',
    branchName: 'MLAP',
  },
};

export default function AdityaBirlaCapitalMLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_CAPITAL_MLAP_CONFIG} {...props} />;
}
