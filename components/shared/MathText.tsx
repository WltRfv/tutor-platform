'use client';
import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function MathText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const html = useMemo(() => {
    if (!children) return '';

    const result: string[] = [];
    const text = children;
    const len = text.length;
    let i = 0;

    while (i < len) {
      // Блок $$...$$
      if (text[i] === '$' && text[i + 1] === '$') {
        const end = text.indexOf('$$', i + 2);
        if (end !== -1) {
          const formula = text.slice(i + 2, end);
          try {
            result.push(
              katex.renderToString(formula, {
                displayMode: true,
                throwOnError: false,
              })
            );
          } catch {
            result.push(escapeHtml(text.slice(i, end + 2)));
          }
          i = end + 2;
          continue;
        }
      }

      // Инлайн $...$
      if (text[i] === '$') {
        const end = text.indexOf('$', i + 1);
        if (end !== -1 && end > i + 1) {
          const formula = text.slice(i + 1, end);
          try {
            result.push(
              katex.renderToString(formula, {
                displayMode: false,
                throwOnError: false,
              })
            );
          } catch {
            result.push(escapeHtml(text.slice(i, end + 1)));
          }
          i = end + 1;
          continue;
        }
      }

      // Обычный текст
      let j = i;
      while (j < len && text[j] !== '$') j++;
      result.push(escapeHtml(text.slice(i, j)));
      i = j;
    }

    return result.join('');
  }, [children]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ whiteSpace: 'pre-wrap' }}
    />
  );
}