function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(value: string) {
  return escapeHtml(value).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
    const safe = href.startsWith("/") || href.startsWith("https://") ? href : "";
    if (!safe) return label;
    return `<a href="${safe}">${label}</a>`;
  });
}

export function renderMarkdown(source: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (!list) return;
    html.push(`<ul>${list.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    list = null;
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (trimmed.startsWith("- ")) {
      list ??= [];
      list.push(renderInline(trimmed.slice(2)));
      continue;
    }
    flush();
    if (trimmed.startsWith("### ")) html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    else if (trimmed.startsWith("## ")) html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    else html.push(`<p>${renderInline(trimmed)}</p>`);
  }
  flush();
  return html.join("");
}
