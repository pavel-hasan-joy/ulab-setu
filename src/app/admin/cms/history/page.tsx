import { requireCmsCapability } from "@/lib/cms-auth";
import { CmsModulePlaceholder } from "@/components/cms/cms-module-placeholder";

export const metadata = {
  title: "History & Archive — Content Management | ULAB Setu Admin",
};

export default async function CmsHistoryPage() {
  await requireCmsCapability("cms:history:view");

  return (
    <CmsModulePlaceholder
      title="Content History, Revisions & Archive"
      moduleKey="history"
      phaseNumber={5}
      phaseTitle="Content Archive, Search, SEO & Governance Audit"
      description="Immutable version ledger tracking all revisions, editorial change summaries, author attribution, and historical rollback capabilities across all content types."
      modelsSupported={["CmsRevision", "CmsContent (ARCHIVED)", "AdminAuditLog"]}
      capabilitiesPlanned={["cms:history:view", "cms:content:archive"]}
    />
  );
}
