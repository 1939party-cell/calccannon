import fs from 'node:fs';
const base = JSON.parse(fs.readFileSync('./config/site.json','utf8')).seo.baseUrl;
const manifest = JSON.parse(fs.readFileSync('./generated/calculators.json','utf8'));
const urls = manifest.map((m:any) => `<url><loc>${base}/calc/${m.id}</loc></url>`).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  ${urls}
</urlset>`;
fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/sitemap.xml', xml);
