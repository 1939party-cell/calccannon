---
import fs from 'node:fs';
import path from 'node:path';
export async function getStaticPaths() {
  const manifest = JSON.parse(fs.readFileSync('./generated/calculators.json','utf8'));
  return manifest.map(m => ({ params: { slug: m.id } }));
}
