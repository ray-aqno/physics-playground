import type { ComponentChildren, VNode } from 'preact';
import { invariant } from '../lib/invariant';

/**
 * Minimal Markdown for lesson text: paragraphs, **bold**, `code`, "- " and "1. " lists, and
 * "|" tables. Builds Preact nodes directly (no innerHTML). Lesson text is our own content.
 */
function inline(text: string): ComponentChildren[] {
  invariant(text.length <= 4000, 'inline text too long');
  const out: ComponentChildren[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  // bound: matches <= text.length
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('**') ? <strong>{tok.slice(2, -2)}</strong> : <code>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function table(lines: readonly string[], key: number): VNode {
  invariant(lines.length >= 2, 'a table needs a header and a separator');
  const cells = (l: string): string[] => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const [head, , ...body] = lines;
  return (
    <div class="table-wrap" key={key}>
      <table>
        <thead><tr>{cells(head ?? '').map((c, i) => <th key={i}>{inline(c)}</th>)}</tr></thead>
        <tbody>{body.map((r, i) => <tr key={i}>{cells(r).map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function block(lines: readonly string[], key: number): VNode {
  invariant(lines.length >= 1, 'a block needs lines');
  const first = lines[0] ?? '';
  if (first.trim().startsWith('|')) return table(lines, key);
  if (/^\d+\.\s/.test(first)) return <ol key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\.\s/, ''))}</li>)}</ol>;
  if (first.startsWith('- ')) return <ul key={key}>{lines.map((l, i) => <li key={i}>{inline(l.slice(2))}</li>)}</ul>;
  return <p key={key}>{inline(lines.join(' '))}</p>;
}

export function Markdown({ text }: { readonly text: string }) {
  invariant(text.length <= 20000, 'markdown too long');
  const blocks = text.split(/\n\s*\n/).map((b) => b.split('\n').filter((l) => l.trim() !== ''));
  return <div class="md">{blocks.filter((b) => b.length > 0).map((b, i) => block(b, i))}</div>;
}
