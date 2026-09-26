const KEYWORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);

function push(tokens, kind, text) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind) last.text += text;
  else tokens.push({ kind, text });
}

/**
 * Tiny Python highlighter. Returns one token list per line so the panel can
 * paint comments, strings, and keywords without a syntax library.
 */
export function highlightPython(source) {
  const tokens = [];
  const text = String(source ?? '');
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '#') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? text.length : end;
      push(tokens, 'comment', text.slice(i, stop));
      i = stop;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const triple = text.startsWith(ch.repeat(3), i);
      const closer = triple ? ch.repeat(3) : ch;
      let end = i + closer.length;
      while (end < text.length && !text.startsWith(closer, end)) {
        if (text[end] === '\\') end += 1;
        end += 1;
      }
      end = Math.min(text.length, end + (end < text.length ? closer.length : 0));
      push(tokens, 'string', text.slice(i, end));
      i = end;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let end = i + 1;
      while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) end += 1;
      const word = text.slice(i, end);
      push(tokens, KEYWORDS.has(word) ? 'keyword' : 'plain', word);
      i = end;
      continue;
    }

    push(tokens, 'plain', ch);
    i += 1;
  }

  const lines = [[]];
  for (const token of tokens) {
    const parts = token.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
