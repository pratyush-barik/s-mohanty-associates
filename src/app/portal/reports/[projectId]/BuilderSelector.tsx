'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

function BuilderLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b8860b]"></div>
    </div>
  );
}

const GeneralReportBuilder = dynamic(() => import('./GeneralReportBuilder'), { ssr: false, loading: () => <BuilderLoading /> });
const IBBIReportBuilder = dynamic(() => import('./IBBIReportBuilder'), { ssr: false, loading: () => <BuilderLoading /> });
const IncomeTaxReportBuilder = dynamic(() => import('./IncomeTaxReportBuilder'), { ssr: false, loading: () => <BuilderLoading /> });

interface BuilderSelectorProps {
  initialFields: any;
  projectId: string;
  projectCode: string;
  status: string;
  userRole: string;
  bucketImages: any[];
  prefill: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
  };
}

export default function BuilderSelector({
  initialFields,
  projectId,
  projectCode,
  status,
  userRole,
  bucketImages,
  prefill,
}: BuilderSelectorProps) {
  const searchParams = useSearchParams();
  const builderFromQuery = searchParams.get('builder');
  const orgTemplate = initialFields?.organisationTemplate;

  if (
    builderFromQuery === 'INCOME_TAX' ||
    (!builderFromQuery && orgTemplate === 'INCOME_TAX')
  ) {
    return (
      <IncomeTaxReportBuilder
        projectId={projectId}
        projectCode={projectCode}
        initialFields={initialFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
      />
    );
  }

  if (
    builderFromQuery === 'IBBI_IVS' ||
    (!builderFromQuery && orgTemplate === 'IBBI_IVS')
  ) {
    return (
      <IBBIReportBuilder
        projectId={projectId}
        projectCode={projectCode}
        initialFields={initialFields}
        status={status}
        userRole={userRole}
        bucketImages={bucketImages}
        prefill={prefill}
      />
    );
  }

  return (
    <GeneralReportBuilder
      projectId={projectId}
      projectCode={projectCode}
      initialFields={initialFields}
      status={status}
      userRole={userRole}
      bucketImages={bucketImages}
      prefill={prefill}
    />
  );
}
