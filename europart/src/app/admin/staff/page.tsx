import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { StaffForm } from "@/components/admin/staff-form";
import { requireAdminSession } from "@/modules/admin/auth";
import { adminRoleLabels, type AdminRoleId } from "@/modules/admin/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminStaffPage() {
  await connection();
  await requireAdminSession("staff");
  const staff = await withDatabase(() =>
    getPrismaClient().staffUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
  );

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        description="RBAC на сервере. Создание сотрудников — только Super Admin."
        title="Staff"
      />
      <StaffForm />
      <AdminTable
        columns={["Name", "Email", "Role", "Active", "Created"]}
        emptyDescription="Сотрудников нет. Первый Super Admin — через bootstrap env."
        emptyTitle="Staff пусто"
        rows={staff.map((row) => [
          row.name,
          row.email,
          adminRoleLabels[row.role as AdminRoleId] ?? row.role,
          row.isActive ? "yes" : "no",
          row.createdAt.toISOString().slice(0, 19),
        ])}
      />
      <AdminApiHint path="/api/admin/staff" />
    </div>
  );
}
