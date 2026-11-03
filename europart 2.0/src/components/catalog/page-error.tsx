"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/state";

export function PageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-16">
      <ErrorState
        description="Повторите запрос. Если ошибка останется, позвоните в EUROPART."
        title="Данные не загрузились"
      />
      <Button className="mt-6" onClick={reset} type="button">
        Повторить
      </Button>
    </Container>
  );
}
