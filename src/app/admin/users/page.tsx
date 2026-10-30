import { saveUserAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/labels";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePermission("users.manage");
  const query = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, email: true, name: true, role: true } });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Пользователи и роли</h1>
      {query.saved && <p className="mt-2 text-sm text-ok">Сохранено.</p>}
      {query.error && <p className="mt-2 text-sm text-rose-700">Проверьте email, пароль и роль. Нельзя снять с себя администратора.</p>}
      <form action={saveUserAction} className="card mt-4 grid gap-2 p-4 md:grid-cols-2">
        <input name="name" required placeholder="Имя" className="field" />
        <input name="email" type="email" required placeholder="Email" className="field" />
        <input name="password" type="password" placeholder="Пароль" className="field" />
        <select name="role" className="field"><option value="MANAGER">Менеджер</option><option value="CONTENT">Контент</option><option value="ADMIN">Администратор</option><option value="CUSTOMER">Покупатель</option></select>
        <button className="btn-navy w-fit">Создать</button>
      </form>
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <form key={user.id} action={saveUserAction} className="grid gap-2 border-b border-line py-3 text-sm md:grid-cols-4">
            <input type="hidden" name="id" value={user.id} />
            <input name="name" defaultValue={user.name} className="field" />
            <input name="email" defaultValue={user.email} className="field" />
            <select name="role" defaultValue={user.role} className="field">{Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <input name="password" type="password" placeholder="Новый пароль" className="field" />
            <button className="btn-ghost w-fit">Обновить</button>
          </form>
        ))}
      </div>
    </div>
  );
}
