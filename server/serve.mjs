import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { handleLeadRequest } from "./http.mjs";

const root = join(process.cwd(), "dist");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

function safeFile(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname.includes("\0")) return null;
  const relative = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = join(root, relative);
  if (!full.startsWith(root)) return null;
  return full;
}

function sendFile(res, file, status = 200) {
  res.writeHead(status, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  const pathname = (req.url || "/").split("?")[0];
  if (pathname === "/api/leads" || pathname === "/api/leads/") {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "method" }));
      return;
    }
    const result = await handleLeadRequest(req);
    res.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(result.body));
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }
  if (pathname.length > 1 && !pathname.endsWith("/") && !extname(pathname)) {
    res.writeHead(301, { Location: `${pathname}/` });
    res.end();
    return;
  }
  const target = safeFile(pathname.endsWith("/") ? `${pathname}index.html` : pathname);
  if (target && existsSync(target) && statSync(target).isFile()) {
    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream" });
      res.end();
      return;
    }
    sendFile(res, target);
    return;
  }
  const missing = join(root, "404.html");
  if (existsSync(missing)) sendFile(res, missing, 404);
  else res.writeHead(404).end();
});

server.listen(port, host, () => {
  console.info(JSON.stringify({ event: "server", result: "listening", port }));
});
