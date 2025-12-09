import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  site: process.env.SITE_BASE_URL || 'https://example.pages.dev',
});
