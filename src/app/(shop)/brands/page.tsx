import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Марки автомобилей",
  description: "Запчасти по маркам: Ford, Chevrolet, Dodge, Jeep, Toyota и другие. Страница марки индексируется, если в базе есть товары.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const makes = await prisma.vehicleMake.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: "Марки" }]} />
      <h1 className="text-3xl font-semibold text-navy">Марки автомобилей</h1>
      <p className="mt-3 max-w-3xl leading-7">Справочник марок редактируется в админке. Ниже только активные марки из базы.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {makes.map((make) => (
          <li key={make.id}>
            <Link href={`/brands/${make.slug}`} className="card block p-4 font-semibold text-navy">
              {make.name}
              <span className="mt-1 block text-sm font-normal text-slate-500">{make.country}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
