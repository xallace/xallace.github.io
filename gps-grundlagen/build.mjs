// Fasst die ES-Module zu js/bundle.js zusammen (klassisches Skript), damit index.html
// auch per Doppelklick über file:// läuft. Browser laden Module dort nicht.
// Aufruf nach jeder Änderung in js/: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const order = ['svg.js', 'data.js', 'figures.js', 'app.js'];
const dir = new URL('./js/', import.meta.url);
const parts = order.map((f) => {
  const src = readFileSync(new URL(f, dir), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace(/^export (const|function|let) /gm, '$1 ');
  return `// ---- ${f} ----\n${src}`;
});
writeFileSync(new URL('bundle.js', dir), `// Erzeugt von build.mjs – nicht von Hand bearbeiten\n(() => {\n'use strict';\n${parts.join('\n')}\n})();\n`);
console.log('js/bundle.js geschrieben');
