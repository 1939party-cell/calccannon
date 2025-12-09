import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const SRC = './calculators';
const OUT = './generated';
const PAGES = path.join(OUT, 'pages');
fs.mkdirSync(PAGES, { recursive: true });

const manifest:any[] = [];
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith('.yml')) continue;
  const y = yaml.load(fs.readFileSync(path.join(SRC, f), 'utf8')) as any;
  if (!y?.id || !y?.title || !y?.formula_js) throw new Error(`Bad calc: ${f}`);
  manifest.push({ id: y.id, title: y.title, category: y.category || 'general' });
  const dir = path.join(PAGES, y.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'def.json'), JSON.stringify(y, null, 2));
}
fs.writeFileSync(path.join(OUT, 'calculators.json'), JSON.stringify(manifest, null, 2));
