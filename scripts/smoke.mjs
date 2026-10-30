const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:3000";

async function check(path, expect, init) {
  const response = await fetch(base + path, init);
  if (response.status !== expect) {
    const text = await response.text();
    throw new Error(`${path} expected ${expect}, got ${response.status}: ${text.slice(0, 180)}`);
  }
  return response;
}

const home = await check("/", 200);
const html = await home.text();
if (!html.includes("Автозапчасти из США")) throw new Error("home h1 missing");
if (!html.includes("Тестовая позиция") && !html.includes("тест")) throw new Error("demo products missing");
await check("/catalog", 200);
await check("/catalog/engine", 200);
await check("/brands/ford/mustang/2018", 200);
await check("/brands/ford/mustang/2018/engine", 200);
await check("/vin-search", 200);
await check("/blog/podbor-po-vin", 200);
await check("/ford-mustang-2018-hood", 200);
await check("/product/missing-product", 404);
await check("/product/test-removed-starter", 410);
await check("/sitemap.xml", 200);
await check("/robots.txt", 200);
const health = await (await check("/api/health", 200)).json();
if (!health.ok) throw new Error("health failed");
const search = await (await check("/api/search?q=TEST-FR3Z16612A", 200)).json();
if (!search.total) throw new Error("oem search empty");
const vin = await check("/api/vin-requests", 200, {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({
    vin: "1HGCM82633A004352",
    partDescription: "Нужен тестовый капот для проверки заявки",
    phone: "+10000000000",
    email: "buyer@example.com",
  }),
});
const vinJson = await vin.json();
if (!vinJson.stored || vinJson.decoderStatus !== "not_connected") throw new Error("vin request was not stored honestly");
console.log("smoke ok");
