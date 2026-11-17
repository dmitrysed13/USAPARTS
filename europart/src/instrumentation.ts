/**
 * Production process boot check. Build does not call this with secrets required
 * for compile — only the running Node server with NODE_ENV=production.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (process.env.EUROPART_SKIP_PROD_ENV_ASSERT === "1") {
    return;
  }
  const { assertProductionEnv } = await import("@/lib/env");
  assertProductionEnv();
}
