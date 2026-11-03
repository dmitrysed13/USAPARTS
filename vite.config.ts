import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Connect } from "vite";
import { defineConfig } from "vite";
import { handleLeadRequest } from "./server/http.mjs";

function leadApi() {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (path !== "/api/leads" && path !== "/api/leads/") {
      next();
      return;
    }
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "method" }));
      return;
    }
    void handleLeadRequest(req)
      .then((result) => {
        res.statusCode = result.status;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(result.body));
      })
      .catch(() => {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "delivery" }));
      });
  };
  return {
    name: "lead-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  appType: "spa",
  plugins: [react(), tailwindcss(), leadApi()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
