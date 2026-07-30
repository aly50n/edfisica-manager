import { readFileSync, writeFileSync } from 'fs';

const files = [
  'index.html', 'admin-edfisica.html', 'css/style.css',
  'js/api.js', 'js/auth.js', 'js/crypto.js',
  'js/ui.js', 'js/admin.js', 'js/aluno.js',
  'apps-script/Code.gs',
];

function extractStrings(src) {
  const strs = [];
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      const start = i;
      i++;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === c) { i++; break; }
        if (c === '`' && src[i] === '$' && src[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth++;
            if (src[i] === '}') depth--;
            if (src[i] === '\\') { i += 2; continue; }
            if (src[i] === '`') break;
            i++;
          }
          if (src[i] === '}') i++;
          continue;
        }
        i++;
      }
      strs.push(src.slice(start, i));
      out += `__S${strs.length - 1}__`;
    } else {
      out += src[i];
      i++;
    }
  }
  return { out, strs };
}

for (const f of files) {
  let src = readFileSync(f, 'utf8');
  const orig = src;

  if (f.endsWith('.html')) {
    src = src.replace(/<!--[\s\S]*?-->/g, '');
    src = src.replace(/\n{3,}/g, '\n\n');
  } else if (f.endsWith('.css')) {
    src = src.replace(/\/\*[\s\S]*?\*\//g, '');
    src = src.replace(/\n{3,}/g, '\n\n');
  } else {
    const { out, strs } = extractStrings(src);
    src = out;
    src = src.replace(/\/\/.*$/gm, '');
    src = src.replace(/\/\*[\s\S]*?\*\//g, '');
    for (let j = 0; j < strs.length; j++) {
      src = src.replace(`__S${j}__`, strs[j]);
    }
    src = src.replace(/\n{4,}/g, '\n\n\n');
  }

  if (src !== orig) {
    writeFileSync(f, src, 'utf8');
    console.log(`✓ ${f} (${orig.length - src.length} bytes removidos)`);
  } else {
    console.log(`- ${f} (sem comentários)`);
  }
}
