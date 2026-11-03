import { connection } from "next/server";
import { pingRedis } from "@/lib/cache/redis";
import { getDatabaseStatus } from "@/lib/db/status";

export async function GET() {
  await connection();
  const [database, redis] = await Promise.all([
    getDatabaseStatus(),
    pingRedis(process.env.REDIS_URL),
  ]);

  return Response.json({
    service: "europart",
    status: database === "down" || redis === "down" ? "degraded" : "ok",
    database,
    redis,
  });
}
