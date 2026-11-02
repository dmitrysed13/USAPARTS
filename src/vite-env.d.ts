/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEAD_WEBHOOK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
