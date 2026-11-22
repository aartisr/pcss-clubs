interface ImportMetaEnv {
  readonly VITE_SITE_REVIEW_STATUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {}
