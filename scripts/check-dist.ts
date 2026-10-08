/**
 * Deploy smoke check (SC11): every script and stylesheet that dist/index.html references must
 * exist in dist/, at the root-relative path Vercel will serve (base "/").
 */
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const refs = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1] ?? '');
const missing = refs.filter((r) => !existsSync(`dist${r}`));
if (refs.length === 0 || missing.length > 0) {
  console.error(refs.length === 0 ? 'dist/index.html references no assets' : `Missing in dist/: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`dist OK: ${refs.length} assets found (${refs.join(', ')})`);
