'use client';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';

export const ADITYA_BIRLA_HOUSING_HLLAP_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA HOUSING FINANCE LTD',
  subTemplateId: 'HL-LAP',
  displayName: 'Aditya Birla Housing Finance Ltd — HL-LAP',
  fieldLabels: {
    loanApplicationNo: 'Deal Number',
    ownerName: 'Applicant Name(s)',
    ownerAddress: 'Address as per request',
  },
  extraFields: {
    'section-1': [
      { key: 'dealNumber', label: 'Deal Number' },
      { key: 'assetId', label: 'Asset ID' },
      { key: 'typeOfCase', label: 'Type of Case' },
      { key: 'productType', label: 'Product Type', default: 'Home Loan' },
      { key: 'valuerFeedback', label: 'Valuer Feedback', default: 'Positive' },
      { key: 'contactedPerson', label: 'Contacted Person' },
      { key: 'relationWithCustomer', label: 'Relation with Customer', default: 'Self' },
      { key: 'contactNo', label: 'Contact No' },
      { key: 'addressAsPerDocument', label: 'Address as per document', type: 'textarea', span: 2 },
      { key: 'addressAsPerSite', label: 'Address as per Site', type: 'textarea', span: 2 },
      { key: 'projectColonyLayoutName', label: 'Project / Colony / Layout Name' },
      { key: 'unitFlatBungalowPlotHouseNo', label: 'Unit / Flat / Bungalow / Plot / House No' },
      { key: 'buildingName', label: 'Building Name' },
      { key: 'floorNo', label: 'Floor No' },
      { key: 'wingName', label: 'Wing Name' },
      { key: 'khasraNo', label: 'S.No / G.No / Khasra No' },
      { key: 'villageName', label: 'Village Name' },
      { key: 'streetName', label: 'Street Name' },
      { key: 'mainLocalityOfProperty', label: 'Main Locality of Property' },
      { key: 'subLocalityOfProperty', label: 'Sub Locality' },
      { key: 'pinCodeOfProperty', label: 'Pin code of Property' },
    ],
  },
  defaultValues: {
    purpose: 'Home Loan / LAP',
  },
};

export default function AdityaBirlaHousingHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_HOUSING_HLLAP_CONFIG} {...props} />;
}
