import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { preview } from "vite";
import { pages } from "../src/seo/pages.ts";
import { assertProductionOrigin } from "../src/seo/origin.ts";

const origin = assertProductionOrigin(process.env.VITE_SITE_URL ?? "");

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
    `--user-data-dir=/tmp/chrome-seo-prerender-${process.pid}`,
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
  let loadWaiters = [];
  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
    if (data.method === "Page.loadEventFired") {
      const waiting = loadWaiters;
      loadWaiters = [];
      for (const resolve of waiting) resolve();
    }
  });
  const send = (method, params = {}) => {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => pending.set(id, resolve));
  };
  const waitForLoad = () =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, 8000);
      loadWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  await send("Page.enable");

  const routes = [
    ...pages.map((item) => ({
      path: item.path,
      heading: item.h1,
      title: item.title,
      canonical: `${origin}${item.path}`,
      out: item.path === "/" ? "dist/index.html" : `dist${item.path}index.html`,
    })),
    {
      path: "/__missing__/",
      heading: "Страница не найдена",
      title: "Страница не найдена | USAPARTS",
      canonical: `${origin}/404.html`,
      out: "dist/404.html",
    },
  ];
  console.log(`prerender ${routes.length} routes`);

  for (const route of routes) {
    const loaded = waitForLoad();
    await send("Page.navigate", { url: `http://127.0.0.1:${port}${route.path}` });
    await loaded;
    let html = "";
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const result = await send("Runtime.evaluate", {
        expression: `JSON.stringify({
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
          html: document.documentElement.outerHTML
        })`,
        returnByValue: true,
      });
      const snapshot = JSON.parse(result.result?.result?.value || "{}");
      html = snapshot.html ?? "";
      const ready =
        snapshot.title === route.title &&
        snapshot.canonical === route.canonical &&
        html.includes(route.heading) &&
        (route.out.endsWith("404.html") || html.includes('data-seo="jsonld"'));
      if (ready) break;
      await sleep(50);
      html = "";
    }
    if (!html.includes(route.heading)) throw new Error(`Prerender missed heading for ${route.path}`);
    if (!html.includes(`<title>${route.title}</title>`)) throw new Error(`Prerender missed title for ${route.path}`);
    if (!html.includes(`href="${route.canonical}"`)) throw new Error(`Prerender missed canonical for ${route.path}`);
    if (!route.out.endsWith("404.html") && !html.includes(`property="og:image" content="${origin}/favicon.svg"`)) {
      throw new Error(`Prerender missed og:image for ${route.path}`);
    }
    if (html.includes("127.0.0.1") || html.includes("localhost")) throw new Error(`Prerender leaked a local host on ${route.path}`);
    await mkdir(dirname(route.out), { recursive: true });
    await writeFile(route.out, `<!doctype html>\n${html.replace(/^<html/i, "<html")}`);
  }
  console.log(`prerendered ${routes.length} routes`);
  ws.close();
} finally {
  chrome.kill();
  await server.close();
}
