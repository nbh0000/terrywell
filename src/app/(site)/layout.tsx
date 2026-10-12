import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollTop } from "@/components/ScrollTop";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <ScrollTop />
    </>
  );
}
