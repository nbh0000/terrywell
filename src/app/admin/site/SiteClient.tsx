"use client";

import { Loading, usePageData } from "@/lib/page";
import { getContent, getSetting } from "@/lib/site";
import { PageTitle } from "../ui";
import { SiteForm } from "./SiteForm";

export function SiteClient() {
  const { data } = usePageData(async () => {
    const [company, shipping, products, mixNotice, home, about, customLabel, editorGuide, pdfConsent, legal] = await Promise.all([
      getSetting("company"),
      getSetting("shipping"),
      getSetting("products"),
      getContent("mixNotice"),
      getContent("home"),
      getContent("about"),
      getContent("customLabel"),
      getContent("editorGuide"),
      getContent("pdfConsent"),
      getContent("legal"),
    ]);
    return { company, shipping, products, mixNotice, home, about, customLabel, editorGuide, pdfConsent, legal };
  });
  return (
    <>
      <PageTitle title="사이트 설정 · 콘텐츠" />
      {!data ? <Loading /> : <SiteForm initial={data} />}
    </>
  );
}
