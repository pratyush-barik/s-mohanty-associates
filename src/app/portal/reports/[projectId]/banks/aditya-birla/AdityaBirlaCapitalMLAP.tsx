'use client';

import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig, BaseReportFields } from '@/lib/bank-fields';
import { PDFAdityaBirlaMLAPRenderer } from '@/lib/banks/pdf-aditya-birla-mlap-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';

interface AccomRow {
  floor: string;
  drawingRoom: string;
  bedroom: string;
  diningRoom: string;
  kitchen: string;
  bathroom: string;
  balcony: string;
}

interface BuaRow {
  floor: string;
  asPerSite: string;
  asPerPlan: string;
  percentageDeviation: string;
}

const DEFAULT_ACCOM_ROWS: AccomRow[] = [
  { floor: 'Ground Floor', drawingRoom: '', bedroom: '2', diningRoom: '', kitchen: '1', bathroom: '', balcony: '' },
  { floor: 'First Floor', drawingRoom: 'NA', bedroom: 'NA', diningRoom: 'NA', kitchen: 'NA', bathroom: 'NA', balcony: 'NA' },
  { floor: 'Second Floor', drawingRoom: 'NA', bedroom: 'NA', diningRoom: 'NA', kitchen: 'NA', bathroom: 'NA', balcony: 'NA' },
  { floor: 'Third Floor', drawingRoom: 'NA', bedroom: 'NA', diningRoom: 'NA', kitchen: 'NA', bathroom: 'NA', balcony: 'NA' },
  { floor: 'Forth Floor', drawingRoom: 'NA', bedroom: 'NA', diningRoom: 'NA', kitchen: 'NA', bathroom: 'NA', balcony: 'NA' },
];

const DEFAULT_BUA_ROWS: BuaRow[] = [
  { floor: 'Ground Floor', asPerSite: 'RCC-1441sqft', asPerPlan: 'NA', percentageDeviation: 'NA' },
  { floor: 'First Floor', asPerSite: 'NA', asPerPlan: 'NA', percentageDeviation: 'NA' },
  { floor: 'Second Floor', asPerSite: 'NA', asPerPlan: 'NA', percentageDeviation: 'NA' },
  { floor: 'Third Floor', asPerSite: 'NA', asPerPlan: 'NA', percentageDeviation: 'NA' },
];

const inputCls = "w-full px-3 py-1.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-xs focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] disabled:bg-[#f1f3f5] disabled:text-[#6c757d] transition-all";

export const ADITYA_BIRLA_CAPITAL_MLAP_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA CAPITAL LTD',
  subTemplateId: 'MLAP',
  displayName: 'Aditya Birla Capital Ltd - MLAP',
  fieldLabels: {
    ownerName: 'Client Name',
    ownerAddress: 'Address as per Document',
    branchName: 'Vertical',
    loanApplicationNo: 'Application No.',
  },

  // ── Exact Nav Bar Sections for this Bank ──
  navSections: [
    { id: 'section-1', title: 'Basic Details' },
    { id: 'section-2', title: 'Location Details' },
    { id: 'section-3', title: 'Property Detailings' },
    { id: 'section-4', title: 'Documentation' },
    { id: 'section-accommodation', title: 'Accommodation' },
    { id: 'section-bua', title: 'Build Up Details' },
    { id: 'section-7', title: 'Valuation Analysis' },
    { id: 'section-8', title: 'Boundary Details' },
    { id: 'section-9', title: 'Remarks' },
    { id: 'section-11', title: 'Photographs' },
    { id: 'section-12', title: 'Maps & Sketches' },
    { id: 'section-13', title: 'Location Map' },
  ],

  // ── Extra Fields in Standard Sections ──
  extraFields: {
    'section-1': [
      { key: 'propertyOwnerName', label: 'Name of Property Owner (with S/O, W/O)', span: 2, default: 'MANASI BEHERA, W/O- GUPTA GANJAN BEHERA' },
      { key: 'initiationDate', label: 'Initiation Date', type: 'date' },
      { key: 'valuerName', label: 'Name of the Valuer', default: 'Er. Satyajit Mohanty' },
    ],
    'section-2': [
      { key: 'propertyAddressAsDocs', label: 'Address as per Document (Khata, Plot, Mouza, Tahasil, Dist, Pin)', type: 'textarea', span: 2, default: 'Khata No - 115/442, Plot No -166/833 (AC.0.060Decs, Agri) ,Mouza-Gobindpur, Tahasil/PS-Sadar, Dist-Keonjhar,Pin-758014' },
      { key: 'propertyAddressAsVisit', label: 'Address as per Physical / Site Visit', type: 'textarea', span: 2, default: 'Khata No - 115/442, Plot No -166/833 (AC.0.060Decs, Agri) ,Mouza-Gobindpur, Tahasil/PS-Sadar, Dist-Keonjhar,Pin-758014' },
      { key: 'addressMatching', label: 'Address Matching', type: 'select', options: ['Yes (As per documents)', 'No (Discrepancy observed)', 'Partially Matching'], default: 'Yes (As per documents)' },
      { key: 'mainLocality', label: 'Main Locality', default: 'Gobindpur,Sadar' },
      { key: 'subLocality', label: 'Sub Locality', default: 'Sadar,Keonjhar' },
      { key: 'localityOccupancy', label: 'Occupancy of Locality', type: 'select', options: ['Fully Occupied', 'Moderately Occupied', 'Sparsely Occupied'], default: 'Fully Occupied' },
      { key: 'populationDensity', label: 'Population Density', type: 'select', options: ['High', 'Moderate', 'Low'], default: 'Moderate' },
      { key: 'distanceFromBranch', label: 'Distance from ABCL Branch', default: '2-Kms' },
      { key: 'distanceFromCityCenter', label: 'Distance from City Center', default: '2-Kms from Keonjhar market area' },
      { key: 'distanceBusStop', label: 'Distance from Bus Stand', default: '2-Km from Labanya Bus Stand Kendujhar' },
      { key: 'distanceRailwayStation', label: 'Distance from Nearest Railway Station', default: '4-Kms from Keonjhar Railway Station' },
      { key: 'amenitiesAvailability', label: 'Availability of Amenities (School/Market)', default: '1-2 Kms' },
      { key: 'approachRoadWidth', label: 'Approach Road Width', default: '10 feet wide Road' },
      { key: 'valuedBefore', label: 'Has Valuator Done Valuation Before?', type: 'yesno', default: 'No' },
      { key: 'valuedBeforeDate', label: 'If Yes When?', default: 'NA' },
      { key: 'landLocked', label: 'Land Locked', type: 'yesno', default: 'No' },
      { key: 'otherEncumbranceFeatures', label: 'Encumbrance / Court Notice / Other Financier Board', type: 'yesno', default: 'No' },
    ],
    'section-3': [
      { key: 'occupantName', label: 'Occupied By (Name)', default: 'NA' },
      { key: 'occupantRelation', label: 'Relation with Client', default: 'NA' },
      { key: 'plotDemarcated', label: 'Property Demarcation (yes/no)', type: 'yesno', default: 'No' },
      { key: 'propertyHolding', label: 'Property Holding', type: 'select', options: ['Freehold', 'Leasehold'], default: 'Freehold' },
      { key: 'propertyJurisdiction', label: 'Situated In Limits', type: 'select', options: ['Gram Panchayat', 'Municipal Corporation', 'Municipality', 'Development Authority / BDA', 'NAC'], default: 'Gram Panchayat' },
      { key: 'dimensionWidth', label: 'Width (Facing Road Side) in feet', default: 'NA' },
      { key: 'dimensionDepth', label: 'Depth (in feet)', default: 'NA' },
      { key: 'cautiousLocations', label: 'Cautious Locations', default: 'NA' },
      { key: 'flatConfigurationType', label: 'Flat Configuration Type', default: 'NA' },
      { key: 'percentageCompletion', label: '% Completion of Property', default: '65%' },
      { key: 'percentageRecommendation', label: '% Recommendation', default: '70%' },
    ],
    'section-4': [
      { key: 'documentsProvided', label: 'Documents Provided', default: 'Copy of Sale deed, ROR & Sketch map' },
      { key: 'sanctionPlanDetails', label: 'Sanction Plan details if provided', default: 'Plan is not provided' },
      { key: 'utilityBills', label: 'Utility Bills (Water bill, electricity bill)', default: 'NA' },
    ],
    'section-8': [
      { key: 'boundarySketchNorth', label: 'Sketch Map - North', default: 'Deepak Behera & Bibhu Ranjan Palei' },
      { key: 'boundarySketchSouth', label: 'Sketch Map - South', default: 'Road' },
      { key: 'boundarySketchEast', label: 'Sketch Map - East', default: 'Sonali Sethi' },
      { key: 'boundarySketchWest', label: 'Sketch Map - West', default: 'Archana Debarchana Sethi' },
      { key: 'boundaryMouzaNorth', label: 'Mouza Map - North', default: 'Plot no-165' },
      { key: 'boundaryMouzaSouth', label: 'Mouza Map - South', default: 'Plot no-168' },
      { key: 'boundaryMouzaEast', label: 'Mouza Map - East', default: 'Plot no-164/856' },
      { key: 'boundaryMouzaWest', label: 'Mouza Map - West', default: 'Plot no-167' },
      { key: 'boundariesMatching', label: 'Boundaries Matching Status', default: 'Yes (Boundary matching as per sketch map)', span: 2 },
    ],
    'section-9': [
      { key: 'engineerVisitedName', label: 'Name of the Engineer Visited', default: 'Mr. Kundan Singh' },
    ],
  },

  // ── Extra Custom Sections with Tables ──
  extraSections: [
    {
      id: 'section-accommodation',
      title: 'Accommodation Details',
      number: '5A',
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const rows: AccomRow[] = fields.accommodationRows || DEFAULT_ACCOM_ROWS;
        const addRow = () => {
          const next = `Floor ${rows.length + 1}`;
          handleChange('accommodationRows', [...rows, { floor: next, drawingRoom: '', bedroom: '', diningRoom: '', kitchen: '', bathroom: '', balcony: '' }]);
        };
        const removeRow = (idx: number) => {
          handleChange('accommodationRows', rows.filter((_, i) => i !== idx));
        };

        return (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Unit Details / Floor</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Drawing Room</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Bedroom</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Dining Room</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Kitchen</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Bathroom</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Balcony</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          className={inputCls + ' font-bold text-[#0f2038]'}
                          value={row.floor || ''}
                          onChange={e => {
                            const u = [...rows];
                            u[idx] = { ...u[idx], floor: e.target.value };
                            handleChange('accommodationRows', u);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      {(['drawingRoom', 'bedroom', 'diningRoom', 'kitchen', 'bathroom', 'balcony'] as (keyof AccomRow)[]).map((colKey) => (
                        <td key={colKey} className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            value={row[colKey] || ''}
                            disabled={isReadOnly}
                            onChange={e => {
                              const u = [...rows];
                              u[idx] = { ...u[idx], [colKey]: e.target.value };
                              handleChange('accommodationRows', u);
                            }}
                            className={inputCls + ' text-center'}
                            placeholder="NA"
                          />
                        </td>
                      ))}
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                            title="Remove Floor"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addRow}
                className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1"
              >
                <span className="text-lg leading-none">+</span> Add Unit / Floor
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: 'section-bua',
      title: 'Build Up Details',
      number: '6A',
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const rows: BuaRow[] = fields.buaRows || DEFAULT_BUA_ROWS;
        const addRow = () => {
          const next = `Floor ${rows.length + 1}`;
          handleChange('buaRows', [...rows, { floor: next, asPerSite: '', asPerPlan: 'NA', percentageDeviation: 'NA' }]);
        };
        const removeRow = (idx: number) => {
          handleChange('buaRows', rows.filter((_, i) => i !== idx));
        };

        return (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Floor</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">As per site</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">As per Plan / Allowed</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Percentage Deviation</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          className={inputCls + ' font-bold text-[#0f2038]'}
                          value={row.floor || ''}
                          onChange={e => {
                            const u = [...rows];
                            u[idx] = { ...u[idx], floor: e.target.value };
                            handleChange('buaRows', u);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          value={row.asPerSite || ''}
                          disabled={isReadOnly}
                          onChange={e => {
                            const u = [...rows];
                            u[idx] = { ...u[idx], asPerSite: e.target.value };
                            handleChange('buaRows', u);
                          }}
                          className={inputCls}
                          placeholder="e.g. RCC-1441sqft"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          value={row.asPerPlan || ''}
                          disabled={isReadOnly}
                          onChange={e => {
                            const u = [...rows];
                            u[idx] = { ...u[idx], asPerPlan: e.target.value };
                            handleChange('buaRows', u);
                          }}
                          className={inputCls}
                          placeholder="NA"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          value={row.percentageDeviation || ''}
                          disabled={isReadOnly}
                          onChange={e => {
                            const u = [...rows];
                            u[idx] = { ...u[idx], percentageDeviation: e.target.value };
                            handleChange('buaRows', u);
                          }}
                          className={inputCls}
                          placeholder="NA"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                            title="Remove Floor"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addRow}
                className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1"
              >
                <span className="text-lg leading-none">+</span> Add Floor Details
              </button>
            )}
          </div>
        );
      },
    },
  ],

  defaultValues: {
    purpose: 'Mortgage Loan Against Property (MLAP)',
    branchName: 'MLAP',
    propertyType: 'Residential',
    usageType: 'Single / Multi-units building - R',
    structureType: 'RCC',
    qualityOfConstruction: 'Average',
    marketability: 'Average',
    ageOfPropertyActual: '0-Years',
    estimatedFutureLife: '60-Years',
    remarks: 'Subject property is a single storied under construction building having land extent of 2613sqft, having measured BUA 1441sqft. This Property is accessible with 15-feet wide road. All civic amenities are present within 1-2 Kms from the property. Surrounding habitation is 50%. The property is coming under Mandua GP limit. At present, GF RCC roof slab completed & stages of construction is about 65%. Valuation has been done for land & measured BUA of single storied under construction building. Note-This land is not converted to homestead & present nature in agri. Customer has submitted homestead conversion receipt vide OLR Case no- 81/2025, dated-05/02/2025. Boundary details are not mentioned in sale deed. Customer has submitted Amin sketch map for the identification & access road. Report is released basing upon the sketch map. Bank to check the authenticity of the sketch map.',
  },

  // ── Custom PDF Generator Hook ──
  generateCustomPDF: async (fields, letterheadBytes, imageResults, fmtDate) => {
    const r = new PDFAdityaBirlaMLAPRenderer();
    await r.init(letterheadBytes || undefined);

    const W_LABEL_2COL = 150;
    const W_VAL_2COL = 373.28;
    const W_LABEL_4COL = 120;
    const W_VAL_4COL = 141.64;

    // 1. Header
    r.drawMainHeader('Aditya Birla Capital Ltd (MLAP)');

    // 2. Basic Details
    r.drawSectionHeader('Basic Details');
    r.drawKeyValueRow([
      { label: 'Client Name', value: fields.ownerName || fields.clientName || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Initiation Date', value: fmtDate(fields.initiationDate || fields.dateOfInspection || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Valuer Name', value: fields.valuerName || 'Er. Satyajit Mohanty', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Visit Date', value: fmtDate(fields.dateOfInspection || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Application No.', value: fields.loanApplicationNo || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Report Date', value: fmtDate(fields.dateOfValuation || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Name of Property Owner', value: fields.propertyOwnerName || fields.ownerName || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL },
    ]);

    // 3. Location Details
    r.drawSectionHeader('Location Details');
    r.drawKeyValueRow([{ label: 'Address as per Document', value: fields.propertyAddressAsDocs || fields.ownerAddress || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Address as per Physical', value: fields.propertyAddressAsVisit || fields.ownerAddress || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Address matching', value: fields.addressMatching || 'Yes (As per documents)', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Co-Ordinates', value: `Lat:-${fields.latitude || '21.636778'},Long:- ${fields.longitude || '85.628000'}`, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    r.drawKeyValueRow([
      { label: 'Main Locality', value: fields.mainLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Sub Locality', value: fields.subLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Locality Type', value: fields.localityType || 'Residential', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Landmark', value: fields.landmark || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Occupancy of Locality', value: fields.localityOccupancy || 'Fully Occupied', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, highlight: true },
      { label: 'Population Density', value: fields.populationDensity || 'Moderate', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, highlight: true },
    ]);
    r.drawKeyValueRow([{ label: 'Distance from ABCL Branch', value: fields.distanceFromBranch || '2-Kms', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from City Center', value: fields.distanceFromCityCenter || '2-Kms from market area', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from Bus Stand', value: fields.distanceBusStop || '2-Km from Bus Stand', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from Nearest Railway Station', value: fields.distanceRailwayStation || '4-Kms from Railway Station', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Availability of Amenities (school,market etc)', value: fields.amenitiesAvailability || '1-2 Kms', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Approach Road Width', value: fields.approachRoadWidth || '10 feet wide Road', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([
      { label: 'Has the Valuator Done Valuation for this property before?', value: fields.valuedBefore || 'No', labelWidth: 260, valueWidth: 50 },
      { label: 'If Yes When?', value: fields.valuedBeforeDate || 'NA', labelWidth: 100, valueWidth: 113.28 },
    ]);
    r.drawKeyValueRow([{ label: 'Land Locked', value: fields.landLocked || 'No', labelWidth: 350, valueWidth: 173.28, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Any other features like board of other financier indicating mortgage, notice of Court/any authority which may affect the title', value: fields.otherEncumbranceFeatures || 'No', labelWidth: 350, valueWidth: 173.28, highlight: true }]);

    // 4. Property Detailings
    r.drawSectionHeader('Property Detailings');
    r.drawKeyValueRow([{ label: 'Occupancy', value: fields.occupiedBy || 'Vacant', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Occupied By', value: fields.occupantName || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Relationship of Occupant with Client', value: fields.occupantRelation || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Property Demarcation (yes/no)', value: fields.plotDemarcated || 'No', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Identification (yes/no)', value: fields.propertyIdentification || 'Yes', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Type', value: fields.propertyType || 'Residential', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Sub Type', value: fields.propertySubType || 'Single / Multi-units building - R', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Holding', value: fields.propertyHolding || 'Freehold', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property situated in Limits', value: fields.propertyJurisdiction || 'Gram Panchayat', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Marketability', value: fields.marketability || 'Average', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Age', value: fields.ageOfPropertyActual || '0-Years', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Residual Age', value: fields.estimatedFutureLife || '60-Years', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Construction Quality', value: fields.qualityOfConstruction || 'Average', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Structure Type', value: fields.structureType || 'RCC', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([
      { label: 'Dimensions of Property: Width (Facing Road Side) in feet', value: fields.dimensionWidth || 'NA', labelWidth: 260, valueWidth: 50, highlight: true },
      { label: 'Depth (in feet)', value: fields.dimensionDepth || 'NA', labelWidth: 100, valueWidth: 113.28, highlight: true },
    ]);
    r.drawKeyValueRow([{ label: 'Cautious Locations', value: fields.cautiousLocations || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'If Flat, Configuration Type', value: fields.flatConfigurationType || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Percentage Completion of Property', value: fields.percentageCompletion || '65%', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Percentage Recommendation of Property', value: fields.percentageRecommendation || '70%', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);

    // 5. Documentation
    r.drawSectionHeader('Documentation');
    r.drawKeyValueRow([{ label: 'Documents Provided', value: fields.documentsProvided || 'Copy of Sale deed, ROR & Sketch map', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Sanction Plan details if provided', value: fields.sanctionPlanDetails || 'Plan is not provided', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Utility Bills (Water bill, electricity bill)', value: fields.utilityBills || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // 6. Accommodation Details
    r.drawSectionHeader('Accomodation Details');
    const accomCols = [80, 70, 70, 70, 70, 80, 83.28];
    const accomRows = (fields.accommodationRows || DEFAULT_ACCOM_ROWS).map((row: AccomRow) => [
      row.floor, row.drawingRoom || '', row.bedroom || '', row.diningRoom || '', row.kitchen || '', row.bathroom || '', row.balcony || ''
    ]);
    r.drawTable(
      ['Unit Details', 'Drawing Room', 'Bedroom', 'Dining Room', 'Kitchen', 'Bathroom', 'Balcony'],
      accomRows,
      accomCols
    );

    // 7. Build Up Details
    r.drawSectionHeader('Build Up Details');
    const buaCols = [110, 140, 140, 133.28];
    const buaRowsData = (fields.buaRows || DEFAULT_BUA_ROWS).map((row: BuaRow) => [
      row.floor, row.asPerSite || 'NA', row.asPerPlan || 'NA', row.percentageDeviation || 'NA'
    ]);
    r.drawTable(
      ['Floor', 'As per site', 'As per Plan/Allowed', 'Percentage Deviation'],
      buaRowsData,
      buaCols
    );

    // 8. Valuation
    r.drawSectionHeader('Valuation');
    const valCols = [240, 95, 95, 93.28];
    const plotSqft = parseFloat(fields.plotAreaDocs || '2613') || 0;
    const landRate = parseFloat(fields.landRate || '800') || 0;
    const landTotalVal = plotSqft * landRate;

    const buaSqft = parseFloat(fields.buaActual || '1441') || 0;
    const bua100Rate = parseFloat(fields.buaActualRate || '1500') || 0;
    const bua100TotalVal = buaSqft * bua100Rate;

    const buaConsRate = parseFloat(fields.buaConsideredRate || '975') || 0;
    const buaConsTotalVal = buaSqft * buaConsRate;

    const amenitiesVal = parseFloat(fields.amenitiesValue || '0') || 0;
    const totalVal = landTotalVal + buaConsTotalVal + amenitiesVal;
    const realizableVal = totalVal * 0.9;
    const distressVal = totalVal * 0.8;

    r.drawTable(
      ['Detailings', 'Area in Sqft', 'Rate/sqft', 'Value'],
      [
        ['Plot Area (As per Documents)', String(plotSqft), String(landRate), `Rs. ${formatIndianCurrency(landTotalVal)}`],
        ['Plot Area (As per Physical)', fields.plotAreaPhysical || String(plotSqft), '-', '-'],
        ['Plot Area (Considered For Valuation)', fields.plotAreaConsidered || String(plotSqft), '-', '-'],
        ['Build Up Area (As per Plan/Document)', fields.buaPlan || 'Plan is not provided', '-', '-'],
        ['Build Up Area (As per Actual) GF RCC on 100% comp', String(buaSqft), String(bua100Rate), `Rs. ${formatIndianCurrency(bua100TotalVal)}`],
        ['Build Up Area (Considered for Valuation) as on date', String(buaSqft), String(buaConsRate), `Rs. ${formatIndianCurrency(buaConsTotalVal)}`],
        ['Super Build Up Area (In case of Composite)', fields.superBua || '-', '-', '-'],
        ['Amenities (like parking etc in unit or lumpsum value)', String(amenitiesVal), '-', `Rs. ${formatIndianCurrency(amenitiesVal)}`],
        ['Total Value', '', '', `Rs. ${formatIndianCurrency(totalVal)}`],
        ['Realizable Value(90%)', '', '', `Rs. ${formatIndianCurrency(realizableVal)}`],
        ['Distress Value(80%)', '', '', `Rs. ${formatIndianCurrency(distressVal)}`],
      ],
      valCols,
      [3]
    );

    // 9. Boundary Details
    r.drawSectionHeader('Boundary Details');
    const boundCols = [103.28, 105, 105, 105, 105];
    r.drawTable(
      ['Detailings', 'North', 'South', 'East', 'West'],
      [
        ['As per Sketch map', fields.boundarySketchNorth || '', fields.boundarySketchSouth || '', fields.boundarySketchEast || '', fields.boundarySketchWest || ''],
        ['As per Mouza Map', fields.boundaryMouzaNorth || '', fields.boundaryMouzaSouth || '', fields.boundaryMouzaEast || '', fields.boundaryMouzaWest || ''],
        ['As per actual', fields.boundaryActualNorth || '', fields.boundaryActualSouth || '', fields.boundaryActualEast || '', fields.boundaryActualWest || ''],
      ],
      boundCols
    );
    r.drawKeyValueRow([{ label: 'Boundaries Matching', value: fields.boundariesMatching || 'Yes (Boundary matching as per sketch map)', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // 10. Remarks
    r.drawRemarksBox('Remarks', fields.remarks || 'N/A');
    r.drawKeyValueRow([{ label: 'Name of the Engineer Visited', value: fields.engineerVisitedName || 'Mr. Kundan Singh', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // 11. Location Map
    let imgPointer = (fields.propertyImages || []).length;
    const sketchImgs = fields.sketchMapImages || [];
    const sketchBytes = imageResults.slice(imgPointer, imgPointer + sketchImgs.length);
    imgPointer += sketchImgs.length;
    const locMapBytes = fields.locationMapImage ? imageResults[imgPointer++] : null;
    const mouzaMapBytes = fields.mouzaMapImage ? imageResults[imgPointer++] : null;
    const cadastralMapBytes = fields.cadastralMapImage ? imageResults[imgPointer++] : null;

    if (locMapBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('Location Map');
      await r.drawImageSection(locMapBytes, `Latitude: -${fields.latitude || '21.636778'}, Longitude: ${fields.longitude || '85.628000'}`);
    }

    // 12. Photographs Grid
    const propImgs = fields.propertyImages || [];
    if (propImgs.length > 0) {
      const photos = propImgs.map((imgUrl: string, idx: number) => ({
        bytes: imageResults[idx],
        label: fields.propertyImageNames?.[idx] || (idx === 0 ? 'Approach Road Pic' : idx === 1 ? 'External Pic' : idx === 2 ? 'Internal Pic' : idx === 3 ? 'Selfie with Client / Customer Representative' : `Photo ${idx + 1}`),
      })).filter((p: any) => p.bytes && p.bytes.length > 0);

      await r.drawPhotoGrid(photos);
    }

    // 13. Maps
    if (mouzaMapBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('MOUZA MAP');
      await r.drawImageSection(mouzaMapBytes, 'Mouza Map (Bhulekh Plot Detail)');
    }

    if (cadastralMapBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('CADASTRAL MAP');
      await r.drawImageSection(cadastralMapBytes, 'Cadastral Satellite Plot Boundary Map');
    }

    if (sketchBytes && sketchBytes.length > 0) {
      for (let i = 0; i < sketchBytes.length; i++) {
        if (sketchBytes[i]) {
          r.checkPageBreak(300);
          r.drawSectionHeader(i === 0 ? 'AMIN HAND-DRAWN SKETCH MAP' : `SKETCH MAP ${i + 1}`);
          await r.drawImageSection(sketchBytes[i], `Hand-Drawn Sketch Map ${i + 1}`);
        }
      }
    }

    return await r.save();
  },
};

export default function AdityaBirlaCapitalMLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_CAPITAL_MLAP_CONFIG} {...props} />;
}
