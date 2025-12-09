---
import fs from 'node:fs';

// Tell Astro which /calc/* pages to build
export async function getStaticPaths() {
  const manifest = JSON.parse(fs.readFileSync('./generated/calculators.json', 'utf8'));
  return manifest.map(m => ({ params: { slug: m.id } }));
}

// Load the calculator definition for this page
const { slug } = Astro.params;
const def = JSON.parse(fs.readFileSync(`./generated/pages/${slug}/def.json`, 'utf8'));
const site = JSON.parse(fs.readFileSync('./config/site.json', 'utf8'));
const title = `${def.title} | ${site.brand}`;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
    <meta name="description" content={`Fast ${def.title} with explanation and examples.`} />
    <style>
      body{font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem}
      label{display:block;margin:.5rem 0} input{padding:.4rem}
      pre{background:#f6f6f6;padding:.6rem;border-radius:6px}
    </style>
  </head>
  <body>
    <header><a href="/">← {site.brand}</a></header>
    <main>
      <h1>{def.title}</h1>
      <form id="calc">
        {def.params.map((p)=> (
          <label>
            {p.label}<br />
            <input name={p.key} type={p.type || 'number'} step={p.step ?? 'any'} min={p.min ?? undefined} max={p.max ?? undefined} />
          </label>
        ))}
      </form>
      <h3>Result</h3>
      <pre id="result">Enter values…</pre>
    </main>

    <script type="module">
      const def = JSON.parse({JSON.stringify(def)});
      function compute(){
        const data = Object.fromEntries(new FormData(document.getElementById('calc')).entries());
        const num = Object.fromEntries(Object.entries(data).map(([k,v])=>[k, Number(v||0)]));
        const fn = new Function(...def.params.map(p=>p.key), def.formula_js + '\\nreturn result || {};');
        let out; try { out = fn(...def.params.map(p=>num[p.key])); } catch(e){ out = { error: String(e) }; }
        document.getElementById('result').textContent = JSON.stringify(out, null, 2);
      }
      document.getElementById('calc').addEventListener('input', compute);
      compute();
    </script>
  </body>
</html>
