import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/nav";
import { AdminNotice } from "@/components/admin/notice";
import { Container } from "@/components/ui/container";
import { requireAdminPage } from "@/modules/admin/guard";

export const metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return (
    <>
      <AdminNav />
      <Container className="py-8">
        <AdminNotice />
        {children}
      </Container>
    </>
  );
}
