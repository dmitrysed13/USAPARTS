import { handleLeadRequest } from "../server/http.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method" });
    return;
  }
  const result = await handleLeadRequest(req);
  res.status(result.status).json(result.body);
}
