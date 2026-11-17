import { connection } from "next/server";
import { handleVinRequest } from "@/modules/vin/http";

export async function POST(request: Request) {
  await connection();
  return handleVinRequest(request);
}
