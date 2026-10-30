export function logError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      message,
      at: new Date().toISOString(),
      ...extra,
    }),
  );
}
