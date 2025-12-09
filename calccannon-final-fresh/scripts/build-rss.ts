import fs from 'node:fs';
const site = JSON.parse(fs.readFileSync('./config/site.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('./generated/calculators.json','utf8'));
const items = manifest.slice(0, 20).map((m:any) => `
  <item>
    <title>${m.title}</title>
    <link>${site.seo.baseUrl}/calc/${m.id}</link>
    <guid>${site.seo.baseUrl}/calc/${m.id}</guid>
  </item>`).join('\n');
const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${site.brand} — New Calculators</title>
    <link>${site.seo.baseUrl}</link>
    <description>${site.seo.siteDescription}</description>
    ${items}
  </channel>
</rss>`;
fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/rss.xml', rss);
