lucide.createIcons();

(function () {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 2600);
}

["vin", "vin-search"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    const start = el.selectionStart;
    el.value = el.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
    el.setSelectionRange(start, start);
  });
});

(function () {
  const input = document.getElementById("phone");
  if (!input) return;
  const template = "+375 (__) ___-__-__";
  function format(rawDigits) {
    const d = rawDigits.slice(0, 9).split("");
    let i = 0;
    let out = "";
    for (const ch of template) out += ch === "_" ? d[i++] ?? "_" : ch;
    return out;
  }
  function getDigits(value) {
    const digits = (value.match(/\d/g) || []).join("");
    if (!digits) return "";
    if (digits.startsWith("375")) return digits.slice(3);
    return digits.length >= 9 ? digits.slice(-9) : digits;
  }
  function setCaret() {
    const pos = input.value.indexOf("_");
    const caret = pos === -1 ? input.value.length : pos;
    requestAnimationFrame(() => input.setSelectionRange(caret, caret));
  }
  function applyMask() {
    input.value = format(getDigits(input.value));
    setCaret();
  }
  input.addEventListener("focus", () => {
    if (!input.value || !input.value.startsWith("+375")) input.value = template;
    setCaret();
  });
  input.addEventListener("input", applyMask);
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    input.value = (e.clipboardData || window.clipboardData).getData("text");
    applyMask();
  });
  input.addEventListener("blur", () => {
    if (!getDigits(input.value)) input.value = "";
  });
})();

(function () {
  let step = 1;
  const tabs = document.querySelectorAll(".step-tab");
  const panels = document.querySelectorAll("[data-panel]");
  const prevBtn = document.getElementById("step-prev");
  const nextBtn = document.getElementById("step-next");
  const brand = document.getElementById("brand");
  const model = document.getElementById("model");
  const form = document.getElementById("parts-finder");
  if (!form || !brand) return;

  const MODELS = window.USAPARTS_MODELS || {};
  const SLUGS = (window.USAPARTS_SLUGS && window.USAPARTS_SLUGS.brands) || {};

  function renderStep() {
    tabs.forEach((tab) => {
      tab.setAttribute("aria-selected", String(Number(tab.dataset.step) === step));
    });
    panels.forEach((panel) => {
      const n = Number(panel.getAttribute("data-panel"));
      const active = n === step;
      panel.classList.toggle("hidden", !active);
      if (panel.classList.contains("sm:grid-cols-3") || panel.classList.contains("sm:grid-cols-2")) {
        panel.classList.toggle("grid", active);
      }
    });
    if (prevBtn) prevBtn.disabled = step === 1;
    if (nextBtn) {
      nextBtn.classList.toggle("invisible", step === 3);
      nextBtn.disabled = step === 3;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      step = Number(tab.dataset.step);
      renderStep();
    });
  });
  if (prevBtn) prevBtn.addEventListener("click", () => { if (step > 1) { step -= 1; renderStep(); } });
  if (nextBtn) nextBtn.addEventListener("click", () => { if (step < 3) { step += 1; renderStep(); } });

  brand.addEventListener("change", () => {
    const list = MODELS[brand.value] || [];
    if (!list.length) {
      model.disabled = true;
      model.innerHTML = '<option value="">Сначала выберите марку</option>';
      return;
    }
    model.disabled = false;
    model.innerHTML =
      '<option value="">Выберите модель</option>' +
      list.map((m) => `<option value="${m.slug}">${m.name}</option>`).join("");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const brandVal = String(data.get("brand") || "");
    const modelSlug = String(data.get("model") || "");
    const partSlug = String(data.get("part_slug") || "");
    const brandSlug = SLUGS[brandVal];
    const modelObj = (MODELS[brandVal] || []).find((m) => m.slug === modelSlug);
    let path = "/parts/";
    if (brandSlug) path += brandSlug + "/";
    if (modelSlug) path += modelSlug + "/";
    if (partSlug) path += partSlug + "/";
    if (brandSlug) {
      window.location.href = path;
      return;
    }
    const carField = document.getElementById("car");
    const vinField = document.getElementById("vin");
    const itemField = document.getElementById("item");
    if (carField && (brandVal || modelObj)) {
      carField.value = [brandVal, modelObj && modelObj.name].filter(Boolean).join(" ");
    }
    if (vinField && data.get("vin")) vinField.value = String(data.get("vin")).toUpperCase();
    if (itemField) {
      const bits = [
        data.get("sku") && `Артикул: ${data.get("sku")}`,
        data.get("part") && `Деталь: ${data.get("part")}`,
        data.get("vin") && `VIN: ${String(data.get("vin")).toUpperCase()}`,
      ].filter(Boolean).join("\n");
      if (bits) itemField.value = bits;
    }
    document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Данные подбора перенесены в заявку");
  });

  renderStep();
})();

(function () {
  const form = document.getElementById("request-form");
  const submitBtn = document.getElementById("request-submit");
  const submitLabel = document.getElementById("request-submit-label");
  if (!form || !submitBtn || !submitLabel) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    submitBtn.disabled = true;
    submitLabel.textContent = "Отправляем...";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.message || "Не удалось отправить заявку");
      showToast(data.message);
      form.reset();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Ошибка отправки заявки");
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Отправить запрос";
    }
  });
})();
