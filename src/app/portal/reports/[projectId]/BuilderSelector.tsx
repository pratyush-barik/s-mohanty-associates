"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { saveReportDraft } from "@/app/actions/project";
import GeneralReportBuilder from "./GeneralReportBuilder";
import IBBIReportBuilder from "./IBBIReportBuilder";
import IncomeTaxReportBuilder from "./IncomeTaxReportBuilder";
import BankReportBuilder from "./BankReportBuilder";

interface BuilderSelectorProps {
  initialFields: any;
  projectId: string;
  projectCode: string;
  status: string;
  userRole: string;
  bucketImages: any[];
  builderQuery?: string;
  prefill: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
  };
}

type BuilderType = "general" | "ibbi" | "income_tax" | "bank";

// Dynamic map for lazy-loading individual bank builders on demand
const BANK_BUILDER_MAP: Record<string, any> = {
  // Aditya Birla
  'ADITYA BIRLA CAPITAL LTD::STSL': dynamic(() => import('./banks/aditya-birla/AdityaBirlaCapitalSTSL')),
  'ADITYA BIRLA CAPITAL LTD::MLAP': dynamic(() => import('./banks/aditya-birla/AdityaBirlaCapitalMLAP')),
  'ADITYA BIRLA CAPITAL LTD': dynamic(() => import('./banks/aditya-birla/AdityaBirlaCapitalSTSL')),
  'ADITYA BIRLA HOUSING FINANCE LTD::HL-LAP': dynamic(() => import('./banks/aditya-birla/AdityaBirlaHousingHLLAP')),
  'ADITYA BIRLA HOUSING FINANCE LTD': dynamic(() => import('./banks/aditya-birla/AdityaBirlaHousingHLLAP')),

  // Annapurna, Arka, Arthan, AU, Ave
  'ANNAPURNA MICRO FINANCE LTD': dynamic(() => import('./banks/annapurna/AnnapurnaMicro')),
  'ARKA FINANCE LTD': dynamic(() => import('./banks/arka/ArkaFinance')),
  'ARTHAN FINANCE': dynamic(() => import('./banks/arthan/ArthanFinance')),
  'AU SMALL FINANCE BANK': dynamic(() => import('./banks/au-sfb/AUSmallFinanceBank')),
  'AVE FINANCE LTD': dynamic(() => import('./banks/ave/AveFinance')),

  // Axis
  'AXIS BANK::AGRI': dynamic(() => import('./banks/axis/AxisAGRI')),
  'AXIS BANK::HL-LAP': dynamic(() => import('./banks/axis/AxisHLLAP')),
  'AXIS BANK::SBB': dynamic(() => import('./banks/axis/AxisSBB')),
  'AXIS BANK::SME': dynamic(() => import('./banks/axis/AxisSME')),
  'AXIS BANK': dynamic(() => import('./banks/axis/AxisHLLAP')),
  'AXIS FINANCE LTD': dynamic(() => import('./banks/axis/AxisFinance')),

  // Bajaj & Bandhan
  'BAJAJ HOUSING FINANCE LTD::HL-LAP': dynamic(() => import('./banks/bajaj/BajajHousingHLLAP')),
  'BAJAJ HOUSING FINANCE LTD': dynamic(() => import('./banks/bajaj/BajajHousingHLLAP')),
  'BANDHAN BANK::HL-LAP': dynamic(() => import('./banks/bandhan/BandhanHLLAP')),
  'BANDHAN BANK::SME': dynamic(() => import('./banks/bandhan/BandhanSME')),
  'BANDHAN BANK': dynamic(() => import('./banks/bandhan/BandhanHLLAP')),

  // BOB, BOI, BOM
  'BANK OF BARODA-BOB': dynamic(() => import('./banks/bank-of-baroda/BankOfBaroda')),
  'BANK OF INDIA-BOI': dynamic(() => import('./banks/bank-of-india/BankOfIndia')),
  'BANK OF MAHARASHTRA-BOM': dynamic(() => import('./banks/bank-of-maharashtra/BankOfMaharashtra')),

  // Canara, CanFin, Chola, Clix
  'CANARA BANK': dynamic(() => import('./banks/canara/CanaraBank')),
  'CANFIN HOMES LTD': dynamic(() => import('./banks/canfin/CanFinHomes')),
  'CHOLAMANDALAM INVESTMENT COMPANY LTD': dynamic(() => import('./banks/chola/CholaInvestment')),
  'CLIX CAPITAL LTD': dynamic(() => import('./banks/clix/ClixCapital')),

  // DCB
  'DCB BANK::Desktop valuation format': dynamic(() => import('./banks/dcb/DCBDesktop')),
  'DCB BANK::HL-LAP-SME': dynamic(() => import('./banks/dcb/DCBHLLAPSME')),
  'DCB BANK': dynamic(() => import('./banks/dcb/DCBHLLAPSME')),

  // GIC, Griham, HDB, HDFC
  'GIC HOUSING FINANCE': dynamic(() => import('./banks/gic/GICHousing')),
  'GRIHAM HOUSING FINANCE': dynamic(() => import('./banks/griham/GrihamHousing')),
  'HDB FINANCIAL SERVICES': dynamic(() => import('./banks/hdb/HDBFinancial')),
  'HDFC BANK::HL-LAP-BLG': dynamic(() => import('./banks/hdfc/HDFCBankHLLAPBLG')),
  'HDFC BANK': dynamic(() => import('./banks/hdfc/HDFCBankHLLAPBLG')),

  // ICICI
  'ICICI BANK::HL-LAP-BBG': dynamic(() => import('./banks/icici/ICICIBankHLLAPBBG')),
  'ICICI BANK::NPA': dynamic(() => import('./banks/icici/ICICIBankNPA')),
  'ICICI BANK': dynamic(() => import('./banks/icici/ICICIBankHLLAPBBG')),

  // IDBI, IDFC, IKF, Indian, IndusInd, ISFC, Jana
  'IDBI BANK': dynamic(() => import('./banks/idbi/IDBIBank')),
  'IDFC FIRST BANK': dynamic(() => import('./banks/idfc/IDFCFirstBank')),
  'IKF FINANCE': dynamic(() => import('./banks/ikf/IKFFinance')),
  'INDIAN BANK': dynamic(() => import('./banks/indian-bank/IndianBank')),
  'INDUSIND BANK': dynamic(() => import('./banks/indusind/IndusIndBank')),
  'ISFC': dynamic(() => import('./banks/isfc/ISFC')),
  'JANA SMALL FINANCE BANK': dynamic(() => import('./banks/jana-sfb/JanaSmallFinanceBank')),

  // Kotak & L&T
  'KOTAK MAHINDRA BANK::BUSINESS BANKING GROUP': dynamic(() => import('./banks/kotak/KotakBBG')),
  'KOTAK MAHINDRA BANK::HL-LAP': dynamic(() => import('./banks/kotak/KotakHLLAP')),
  'KOTAK MAHINDRA BANK': dynamic(() => import('./banks/kotak/KotakHLLAP')),
  'L&T FINANCIAL SERVICES': dynamic(() => import('./banks/lt/LTFinancialServices')),

  // LIC
  'LIC HOUSING FINANCE LTD::NPA-DEFAULT CASES': dynamic(() => import('./banks/lic/LICNPA')),
  'LIC HOUSING FINANCE LTD::PVR-1(SELF CONSTRUCTIONLA-L & B)': dynamic(() => import('./banks/lic/LICPVR1')),
  'LIC HOUSING FINANCE LTD::PVR-2(FLAT-UNDERCONSTRUCTION)': dynamic(() => import('./banks/lic/LICPVR2')),
  'LIC HOUSING FINANCE LTD::PVR-3(LAP-RENNOVATION-BOTH L&B-FLAT)': dynamic(() => import('./banks/lic/LICPVR3')),
  'LIC HOUSING FINANCE LTD::PVR-4(LAND PURCHSASE ONLY)': dynamic(() => import('./banks/lic/LICPVR4')),
  'LIC HOUSING FINANCE LTD::PVR-5 (SUBSEQUENT VALUATION REPORT)': dynamic(() => import('./banks/lic/LICPVR5')),
  'LIC HOUSING FINANCE LTD': dynamic(() => import('./banks/lic/LICPVR1')),

  // Mahindra, Manappuram, Navdhan, Neo, PNB Housing, Poonawalla, Proteum, Punjab & Sind, PNB, Purple
  'MAHINDRA FINANCE LTD': dynamic(() => import('./banks/mahindra/MahindraFinance')),
  'MANAPPURAM HOUSING FINANCE': dynamic(() => import('./banks/manappuram/ManappuramHousing')),
  'NAVDHAN FINANCE': dynamic(() => import('./banks/navdhan/NavdhanFinance')),
  'NEO GROWTH': dynamic(() => import('./banks/neo/NeoGrowth')),
  'PNB HOUSING FINANCE LTD::HL-LAP': dynamic(() => import('./banks/pnb-housing/PNBHousingHLLAP')),
  'PNB HOUSING FINANCE LTD': dynamic(() => import('./banks/pnb-housing/PNBHousingHLLAP')),
  'POONAWALLA FINANCE': dynamic(() => import('./banks/poonawalla/PoonawallaFinance')),
  'PROTEUM FINANCE': dynamic(() => import('./banks/proteum/ProteumFinance')),
  'PUNJAB & SIND BANK': dynamic(() => import('./banks/punjab-sind/PunjabSindBank')),
  'PUNJAB NATIONAL BANK': dynamic(() => import('./banks/punjab-national/PunjabNationalBank')),
  'PURPLE FINANCE': dynamic(() => import('./banks/purple/PurpleFinance')),

  // Sammunati, SBI, Shriram, SMFG, Suryoday, Swarna
  'SAMMUNATI FINANCE': dynamic(() => import('./banks/sammunati/SammunatiFinance')),
  'STATE BANK OF INDIA-SBI': dynamic(() => import('./banks/sbi/StateBankOfIndia')),
  'STATE BANK OF INDIA': dynamic(() => import('./banks/sbi/StateBankOfIndia')),
  'SHRIRAM FINANCE': dynamic(() => import('./banks/shriram/ShriramFinance')),
  'SMFG INDIA-FULLERTON': dynamic(() => import('./banks/smfg/SMFGIndiaFullerton')),
  'SURYODAY SMALL FINANCE BANK': dynamic(() => import('./banks/suryoday/SuryodaySmallFinanceBank')),
  'SWARNA FINANCE': dynamic(() => import('./banks/swarna/SwarnaFinance')),

  // Tata, UCO, Ujjivan, UBI, Unity, Utkarsh, Varthana, Vistaar, Yes
  'TATA CAPITAL LTD::SME-BLG': dynamic(() => import('./banks/tata/TataCapitalSMEBLG')),
  'TATA CAPITAL LTD': dynamic(() => import('./banks/tata/TataCapitalSMEBLG')),
  'TATA HOUSING FINANCE LTD': dynamic(() => import('./banks/tata/TataHousingFinance')),
  'UCO BANK': dynamic(() => import('./banks/uco/UCOBank')),
  'UJJIVAN SMALL FINANCE BANK': dynamic(() => import('./banks/ujjivan/UjjivanSmallFinanceBank')),
  'UNION BANK OF INDIA-UBI': dynamic(() => import('./banks/union-bank/UnionBankOfIndia')),
  'UNITY SMALL FINANCE BANK': dynamic(() => import('./banks/unity-sfb/UnitySmallFinanceBank')),
  'UTKARSH SMALL FINANCE BANK': dynamic(() => import('./banks/utkarsh/UtkarshSmallFinanceBank')),
  'VARTHANA FINANCE': dynamic(() => import('./banks/varthana/VarthanaFinance')),
  'VISTAAR FINANCE': dynamic(() => import('./banks/vistaar/VistaarFinance')),
  'YES BANK': dynamic(() => import('./banks/yes-bank/YesBank')),
};

export default function BuilderSelector({
  initialFields,
  projectId,
  projectCode,
  status,
  userRole,
  bucketImages,
  builderQuery,
  prefill,
}: BuilderSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBuilder = builderQuery || searchParams.get("builder");

  const resolveBuilderType = (fields: any, queryParam?: string | null): BuilderType => {
    if (queryParam === "INCOME_TAX") return "income_tax";
    if (queryParam === "IBBI_IVS") return "ibbi";
    if (fields?.organisationTemplate === "INCOME_TAX") return "income_tax";
    if (fields?.organisationTemplate === "IBBI_IVS") return "ibbi";
    if (fields?.clientType === "organisation" && fields?.organisationTemplate) {
      return "bank";
    }
    return "general";
  };

  const [activeFields, setActiveFields] = useState(initialFields);
  const [activeBuilder, setActiveBuilder] = useState<BuilderType>(resolveBuilderType(initialFields, initialBuilder));
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setActiveFields(initialFields);
    const builderFromQuery = builderQuery || searchParams.get("builder");
    setActiveBuilder(resolveBuilderType(initialFields, builderFromQuery));
  }, [initialFields, builderQuery, searchParams]);

  // Lock browser back & forward buttons
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, []);

  const navigateToBuilder = (target: BuilderType, updatedFields: any) => {
    setActiveFields(updatedFields);
    setActiveBuilder(target);
    const url =
      target === "general" || target === "bank"
        ? window.location.pathname
        : window.location.pathname + "?builder=" + (target === "ibbi" ? "IBBI_IVS" : "INCOME_TAX");
    window.history.replaceState(null, "", url);
    saveReportDraft(projectId, updatedFields).catch((e) => console.error("Save draft in background failed:", e));
  };

  const handleReset = async () => {
    const clearedFields = { clientType: "", organisationTemplate: "", institutionCategory: "", organisationSubTemplate: "" };
    setActiveFields(clearedFields);
    setActiveBuilder("general");
    setResetKey((prev) => prev + 1);

    router.replace(window.location.pathname);

    try {
      const res = await saveReportDraft(projectId, clearedFields);
      if (res && 'error' in res && res.error) {
        alert(`Failed to reset report: ${res.error}`);
      }
    } catch (err) {
      console.error("Reset save draft failed:", err);
    }
  };

  // Find bank specific builder if available
  const SelectedBankBuilder = useMemo(() => {
    if (activeBuilder !== "bank") return null;
    const org = activeFields?.organisationTemplate || "";
    const sub = activeFields?.organisationSubTemplate || "";
    const fullKey = sub ? `${org}::${sub}` : org;
    return BANK_BUILDER_MAP[fullKey] || BANK_BUILDER_MAP[org] || BankReportBuilder;
  }, [activeBuilder, activeFields?.organisationTemplate, activeFields?.organisationSubTemplate]);

  if (activeBuilder === "income_tax") {
    return (
      <IncomeTaxReportBuilder
        key={`income_tax-${resetKey}`}
        projectId={projectId}
        projectCode={projectCode}
        initialFields={activeFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
        onReset={handleReset}
      />
    );
  }

  if (activeBuilder === "ibbi") {
    return (
      <IBBIReportBuilder
        key={`ibbi-${resetKey}`}
        projectId={projectId}
        projectCode={projectCode}
        initialFields={activeFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
        onReset={handleReset}
      />
    );
  }

  if (activeBuilder === "bank" && SelectedBankBuilder) {
    const BankComponent = SelectedBankBuilder;
    return (
      <BankComponent
        key={`bank-${activeFields?.organisationTemplate}-${activeFields?.organisationSubTemplate}-${resetKey}`}
        projectId={projectId}
        projectCode={projectCode}
        initialFields={activeFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
        onResetWizard={handleReset}
      />
    );
  }

  return (
    <GeneralReportBuilder
      key={`general-${resetKey}`}
      projectId={projectId}
      projectCode={projectCode}
      initialFields={activeFields}
      status={status}
      userRole={userRole}
      bucketImages={bucketImages}
      prefill={prefill}
      onNavigateToBuilder={(target: 'ibbi' | 'income_tax' | 'bank', updatedFields: any) => navigateToBuilder(target === "income_tax" ? "income_tax" : target === "ibbi" ? "ibbi" : "bank", updatedFields)}
      onResetWizard={handleReset}
    />
  );
}
