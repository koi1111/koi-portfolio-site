import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const demos = [
  ['ctc', 'ctc-demo.css', 'ctc-demo.js'],
  ['otb', 'otb-demo.css', 'otb-demo.js'],
  ['gap-radar', 'radar-demo.css', 'radar-demo.js'],
  ['buyflow', 'buyflow-demo.css', 'buyflow-demo.js'],
];

for (const [name, cssFile, jsFile] of demos) {
  const htmlPath = join(root, 'demos', `${name}.html`);
  const [html, css, js] = await Promise.all([
    readFile(htmlPath, 'utf8'),
    readFile(join(root, 'demos', cssFile), 'utf8'),
    readFile(join(root, 'demos', jsFile), 'utf8'),
  ]);
  const bundled = html
    .replace(`<link rel="stylesheet" href="${cssFile}">`, () => `<style>${css}</style>`)
    .replace(`<script src="${jsFile}"></script>`, () => `<script>${js.replaceAll('</script>', '<\\/script>')}</script>`);
  await writeFile(join(root, 'demos', `${name}-bundle.html`), bundled);
  console.log(`bundled ${name}`);
}
