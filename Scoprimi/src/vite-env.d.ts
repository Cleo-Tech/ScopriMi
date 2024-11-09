/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_BACKEND_URL: string;
  PROD: boolean;
  DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
