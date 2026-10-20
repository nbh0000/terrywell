import { FaqEditClient } from "./FaqEditClient";

export const metadata = { title: "자주 묻는 질문 편집" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function EditFaq() {
  return <FaqEditClient />;
}
