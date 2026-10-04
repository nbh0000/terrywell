import { getContent, getSetting } from "@/lib/site";
import { PageTitle } from "../ui";
import { SiteForm } from "./SiteForm";

export const metadata = { title: "사이트 설정" };

export default async function AdminSite() {
  const [company, shipping, home, about, customLabel, editorGuide, pdfConsent] = await Promise.all([
    getSetting("company"),
    getSetting("shipping"),
    getContent("home"),
    getContent("about"),
    getContent("customLabel"),
    getContent("editorGuide"),
    getContent("pdfConsent"),
  ]);
  return (
    <>
      <PageTitle title="사이트 설정 · 콘텐츠" />
      <SiteForm initial={{ company, shipping, home, about, customLabel, editorGuide, pdfConsent }} />
    </>
  );
}
