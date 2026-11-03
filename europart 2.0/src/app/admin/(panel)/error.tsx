"use client";

import { ErrorState } from "@/components/ui/state";

export default function AdminError() {
  return (
    <ErrorState
      description="Данные админ-панели сейчас не загрузились. Обновите страницу. Публичный каталог от этого не меняется."
      title="Раздел недоступен"
    />
  );
}
