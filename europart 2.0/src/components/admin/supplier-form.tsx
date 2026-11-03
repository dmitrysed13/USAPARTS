import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";

export function SupplierForm({
  action,
  supplier,
}: {
  action: string;
  supplier?: {
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    note: string | null;
    apiEnabled: boolean;
    credentialsEnvKey: string | null;
    isActive: boolean;
  };
}) {
  return (
    <form action={action} className="grid gap-4" method="post">
      <Field htmlFor="name" label="Название">
        <input
          className={controlClassName}
          defaultValue={supplier?.name}
          id="name"
          name="name"
          required
        />
      </Field>
      <Field
        hint="Латиница, цифры и дефисы. Если пусто, код соберётся из названия."
        htmlFor="code"
        label="Код"
      >
        <input
          className={controlClassName}
          defaultValue={supplier?.code}
          id="code"
          name="code"
        />
      </Field>
      <Field htmlFor="email" label="Почта">
        <input
          className={controlClassName}
          defaultValue={supplier?.email ?? ""}
          id="email"
          name="email"
          type="email"
        />
      </Field>
      <Field htmlFor="phone" label="Телефон">
        <input
          className={controlClassName}
          defaultValue={supplier?.phone ?? ""}
          id="phone"
          name="phone"
        />
      </Field>
      <Field htmlFor="note" label="Заметка">
        <textarea
          className={`${controlClassName} h-28 py-3`}
          defaultValue={supplier?.note ?? ""}
          id="note"
          name="note"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={supplier?.apiEnabled} name="apiEnabled" type="checkbox" />
        Отметить, что у поставщика будет API
      </label>
      <Field
        hint="Только имя переменной окружения, например SUPPLIER_ACME_TOKEN. Секрет в базу не записывается."
        htmlFor="credentialsEnvKey"
        label="Имя переменной с ключом API"
      >
        <input
          className={controlClassName}
          defaultValue={supplier?.credentialsEnvKey ?? ""}
          id="credentialsEnvKey"
          name="credentialsEnvKey"
        />
      </Field>
      {supplier ? (
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked={supplier.isActive} name="isActive" type="checkbox" />
          Поставщик активен
        </label>
      ) : null}
      <button className={buttonClassName()} type="submit">
        Сохранить
      </button>
    </form>
  );
}
