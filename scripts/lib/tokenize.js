// Minimal JavaScript tokenizer: finds string literals, comments and identifiers with their positions.
// Enough for the ATIM codecs (no template literals with expressions, few regex literals).
function scan(code) {
  const out = [];
  let i = 0;
  let lastSignificant = '';
  const n = code.length;
  while (i < n) {
    const c = code[i];
    const d = code[i + 1];
    if (c === '/' && d === '/') {
      const s = i;
      while (i < n && code[i] !== '\n') i++;
      out.push({ kind: 'line', start: s, end: i, text: code.slice(s + 2, i) });
      continue;
    }
    if (c === '/' && d === '*') {
      const s = i;
      i = code.indexOf('*/', i + 2);
      if (i < 0) throw new Error('unterminated comment');
      i += 2;
      out.push({ kind: 'block', start: s, end: i, text: code.slice(s + 2, i - 2) });
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const s = i;
      i++;
      let val = '';
      while (i < n && code[i] !== c) {
        if (code[i] === '\\') { val += code[i] + code[i + 1]; i += 2; continue; }
        if (code[i] === '\n' && c !== '`') throw new Error('newline in string at ' + s);
        val += code[i++];
      }
      i++;
      out.push({ kind: 'string', quote: c, start: s, end: i, value: val });
      lastSignificant = 'x';
      continue;
    }
    if (c === '/' && /[=(,:\[!&|?{};]|^$|return$/.test(lastSignificant)) {
      // regex literal
      i++;
      let inClass = false;
      while (i < n) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === '[') inClass = true;
        else if (code[i] === ']') inClass = false;
        else if (code[i] === '/' && !inClass) break;
        i++;
      }
      i++;
      while (/[a-z]/.test(code[i])) i++;
      lastSignificant = 'x';
      continue;
    }
    if (!/\s/.test(c)) {
      if (/[0-9]/.test(c)) {
        // number literal (0x1A, 1e3, 0.5): never an identifier
        while (i < n && /[\w.]/.test(code[i])) i++;
        lastSignificant = 'x';
        continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        let s = i;
        while (i < n && /[\w$]/.test(code[i])) i++;
        const word = code.slice(s, i);
        out.push({ kind: 'ident', start: s, end: i, value: word });
        lastSignificant = word === 'return' ? 'return' : 'x';
        continue;
      }
      lastSignificant = c;
    }
    i++;
  }
  return out;
}

// Replace tokens using fn(token) -> replacement source text or undefined.
function rewrite(code, fn) {
  const toks = scan(code);
  let res = '';
  let pos = 0;
  for (const t of toks) {
    const r = fn(t);
    if (r === undefined) continue;
    res += code.slice(pos, t.start) + r;
    pos = t.end;
  }
  return res + code.slice(pos);
}

module.exports = { scan, rewrite };
