"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { saveReportDraft } from "@/app/actions/project";
import GeneralReportBuilder from "./GeneralReportBuilder";
import IBBIReportBuilder from "./IBBIReportBuilder";
import IncomeTaxReportBuilder from "./IncomeTaxReportBuilder";

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

type BuilderType = "general" | "ibbi" | "income_tax";

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

  const initialBuilderType: BuilderType =
    initialBuilder === "INCOME_TAX"
      ? "income_tax"
      : initialBuilder === "IBBI_IVS"
        ? "ibbi"
        : initialFields?.organisationTemplate === "INCOME_TAX"
          ? "income_tax"
          : initialFields?.organisationTemplate === "IBBI_IVS"
            ? "ibbi"
            : "general";

  const [activeFields, setActiveFields] = useState(initialFields);
  const [activeBuilder, setActiveBuilder] = useState<BuilderType>(initialBuilderType);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setActiveFields(initialFields);
    
    const builderFromQuery = builderQuery || searchParams.get("builder");
    if (builderFromQuery === "INCOME_TAX") setActiveBuilder("income_tax");
    else if (builderFromQuery === "IBBI_IVS") setActiveBuilder("ibbi");
    else if (!builderFromQuery) {
      if (initialFields?.organisationTemplate === "INCOME_TAX") setActiveBuilder("income_tax");
      else if (initialFields?.organisationTemplate === "IBBI_IVS") setActiveBuilder("ibbi");
      else setActiveBuilder("general");
    }
  }, [initialFields, builderQuery, searchParams]);

  // Lock browser back & forward buttons
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = (event: PopStateEvent) => {
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
      target === "general"
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

    // Clear builder URL search param instantly on the client
    router.replace(window.location.pathname);

    // Save in the background
    try {
      const res = await saveReportDraft(projectId, clearedFields);
      if (res && 'error' in res && res.error) {
        alert(`Failed to reset report: ${res.error}`);
      }
    } catch (err) {
      console.error("Reset save draft failed:", err);
    }
  };

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
      onNavigateToBuilder={(target: 'ibbi' | 'income_tax', updatedFields: any) => navigateToBuilder(target === "income_tax" ? "income_tax" : "ibbi", updatedFields)}
      onResetWizard={handleReset}
    />
  );
}
