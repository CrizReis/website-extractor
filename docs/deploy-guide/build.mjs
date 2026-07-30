/**
 * build.mjs — remonta o HTML publicável desta pasta.
 *
 * Esta pasta guarda a página em forma editável: `index.html` puxa `styles.css`,
 * `script.js` e os arquivos de `assets/`. É assim que se trabalha nela.
 *
 * Para PUBLICAR na claude.ai é preciso o contrário: um arquivo único, com tudo
 * embutido dentro dele. Artefatos rodam sob uma política de segurança que bloqueia
 * qualquer requisição a servidor externo — CSS, JS, fontes e imagens não podem
 * estar em arquivos separados.
 *
 * Este script faz essa conversão. Rode-o e ele gera `<nome-da-pasta>.html` aqui
 * mesmo, pronto pra publicar. O arquivo gerado é descartável: dá pra apagar
 * depois de publicar e regerar quando precisar.
 *
 *   node build.mjs            gera o HTML publicável
 *   node build.mjs --check    compara com o que já existe, sem gravar
 *
 * Ao republicar, aponte para a MESMA URL do artefato — assim o link não muda.
 * Publicar sem informar a URL cria um artefato novo em outro endereço.
 *
 * Não precisa instalar nada: só Node.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR  = path.dirname(fileURLToPath(import.meta.url));
const SLUG = path.basename(DIR);

const MIME = {
  woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
};

const inlineAssets = (text) => {
  for (const rel of [...text.matchAll(/assets\/[a-z]+\/[A-Za-z0-9._-]+/g)].map(m => m[0])) {
    const ext = path.extname(rel).slice(1).toLowerCase();
    const mime = MIME[ext];
    if (!mime) throw new Error(`extensão sem MIME conhecido: ${rel}`);
    const file = path.join(DIR, rel);
    if (!fs.existsSync(file)) throw new Error(`asset faltando: ${rel}`);
    const b64 = fs.readFileSync(file).toString('base64');
    text = text.split(rel).join(`data:${mime};base64,${b64}`);
  }
  return text;
};

const need = f => {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) throw new Error(`arquivo obrigatório não encontrado: ${f}`);
  return fs.readFileSync(p, 'utf8');
};

const html = need('index.html');
const css  = inlineAssets(need('styles.css'));
const jsPath = path.join(DIR, 'script.js');
const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : null;

let out = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}</style>`);
if (js !== null) out = out.replace('<script src="script.js"></script>', `<script>\n${js}</script>`);
out = inlineAssets(out);

const dest = path.join(DIR, `${SLUG}.html`);
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);

if (process.argv.includes('--check')) {
  const cur = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
  if (cur === null) { console.log(`${SLUG}.html não existe (rode 'node build.mjs' para gerar)`); process.exit(0); }
  const ok = cur === out;
  console.log(`${ok ? 'OK' : 'DIFF'}  ${SLUG}.html (${kb} KB)`);
  process.exit(ok ? 0 : 1);
}

fs.writeFileSync(dest, out, 'utf8');
console.log(`gerado  ${SLUG}.html  (${kb} KB)`);
