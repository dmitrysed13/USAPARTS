import { SupplierForm } from "@/components/admin/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="font-display text-3xl font-semibold">Новый поставщик</h1>
      <SupplierForm action="/api/admin/suppliers" />
    </div>
  );
}
