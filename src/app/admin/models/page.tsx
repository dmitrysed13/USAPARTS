import { prisma } from "@/lib/db";
import { saveModelAction } from "@/server/actions/admin";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function ModelsAdmin() {
  await requirePermission("catalog.write");
  const [makes, models] = await Promise.all([
    prisma.vehicleMake.findMany({ orderBy: { name: "asc" } }),
    prisma.vehicleModel.findMany({ orderBy: { name: "asc" }, include: { make: true }, take: 200 }),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Модели</h1>
      <form action={saveModelAction} className="card mt-4 grid gap-2 p-4 md:grid-cols-2">
        <select name="makeId" className="field" required>
          {makes.map((make) => <option key={make.id} value={make.id}>{make.name}</option>)}
        </select>
        <input name="name" required placeholder="Модель" className="field" />
        <input name="slug" placeholder="slug" className="field" />
        <input name="year" placeholder="Год поколения" className="field" />
        <input name="engineName" placeholder="Двигатель" className="field" />
        <input name="engineCode" placeholder="Код двигателя" className="field" />
        <textarea name="intro" placeholder="Текст модели" className="field md:col-span-2" />
        <button className="btn-navy w-fit" type="submit">Сохранить модель и год</button>
      </form>
      <ul className="mt-4 text-sm">{models.map((model) => <li key={model.id} className="border-b border-line py-2">{model.make.name} {model.name}</li>)}</ul>
    </div>
  );
}
