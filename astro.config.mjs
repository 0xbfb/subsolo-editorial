import { defineConfig } from 'astro/config';

const normalizedBase = (value) => {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
};

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  site: process.env.SUBSOLO_SITE_URL ?? 'http://localhost:4321',
  base: normalizedBase(process.env.SUBSOLO_BASE_PATH),
});
