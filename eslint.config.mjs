import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "storage/**", "prisma/migrations/**"],
  },
  {
    // Product images go through /api/media, which negotiates AVIF/WebP with sharp.
    // next/image would fetch that route again and optimize a second time.
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
