import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { preview } from "vite";
import { pages } from "../src/seo/pages.ts";

const port = 4173;
const server = await preview({
  preview: { host: "127.0.0.1", port, strictPort: true },
});

const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9444",
    "--user-data-dir=/tmp/chrome-seo-prerender",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  let targets = [];
  for (let attempt = 0; attempt < 40 && targets.length === 0; attempt += 1) {
    await sleep(150);
    try {
      targets = await fetch("http://127.0.0.1:9444/json/list").then((response) => response.json());
    } catch {
      targets = [];
    }
  }
  const page = targets.find((item) => item.type === "page");
  if (!page) throw new Error("Chrome did not open a page for prerender");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  });
  const send = (method, params = {}) => {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => pending.set(id, resolve));
  };
  await send("Page.enable");

  const routes = [
    ...pages.map((item) => ({ path: item.path, heading: item.h1, out: item.path === "/" ? "dist/index.html" : `dist${item.path}index.html` })),
    { path: "/__missing__/", heading: "Страница не найдена", out: "dist/404.html" },
  ];

  for (const route of routes) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}${route.path}` });
    let html = "";
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await sleep(200);
      const result = await send("Runtime.evaluate", {
        expression: "document.documentElement.outerHTML",
        returnByValue: true,
      });
      html = result.result?.result?.value ?? "";
      if (html.includes(route.heading) && html.includes('data-seo="jsonld"') || (route.out.endsWith("404.html") && html.includes(route.heading))) break;
    }
    if (!html.includes(route.heading)) throw new Error(`Prerender missed heading for ${route.path}`);
    if (html.includes("127.0.0.1")) throw new Error(`Prerender leaked the preview host on ${route.path}`);
    await mkdir(dirname(route.out), { recursive: true });
    await writeFile(route.out, `<!doctype html>\n${html.replace(/^<html/i, "<html")}`);
    console.log(`prerendered ${route.path}`);
  }
  ws.close();
} finally {
  chrome.kill();
  await server.close();
}
