import { handleLeadRequest } from "../../server/http.mjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: "method" }) };
  }
  const result = await handleLeadRequest({
    body: event.body,
    headers: event.headers ?? {},
    socket: {},
  });
  return {
    statusCode: result.status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(result.body),
  };
}
