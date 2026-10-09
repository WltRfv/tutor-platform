'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export function MathText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  if (!children) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          // ─── Параграфы: отступ снизу, читаемая строка ───
          p: ({ children }) => (
            <p className="whitespace-pre-wrap leading-7 mb-4 text-[15px] last:mb-0">
              {children}
            </p>
          ),

          // ─── Заголовки с отступами ───
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mt-8 mb-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white mt-8 mb-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white mt-6 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-white mt-4 mb-2">
              {children}
            </h4>
          ),

          // ─── Списки с отступами ───
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-1.5 my-4 text-[15px] leading-7">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1.5 my-4 text-[15px] leading-7">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 marker:text-purple-400">{children}</li>
          ),

          // ─── Жирный, курсив ───
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">{children}</em>
          ),

          // ─── Разделитель ───
          hr: () => <hr className="border-white/10 my-6" />,

          // ─── Ссылки ───
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),

          // ─── Картинки ───
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === 'string' ? src : ''}
              alt={alt || ''}
              className="rounded-xl border border-white/10 my-5 max-h-[600px] object-contain mx-auto block"
            />
          ),

          // ─── Таблицы с отступами ───
          table: ({ children }) => (
            <div className="overflow-x-auto my-5 rounded-xl border border-white/10">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/10 px-4 py-3 text-left font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/5 px-4 py-2.5 align-top text-slate-300">
              {children}
            </td>
          ),

          // ─── Код ───
          code: ({ children, className: codeClass }) => {
            const isBlock = (codeClass || '').includes('language-');
            if (isBlock) {
              return (
                <pre className="bg-slate-950/80 border border-white/10 rounded-lg p-4 text-xs font-mono text-slate-200 overflow-x-auto my-4">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-white/10 rounded px-1.5 py-0.5 text-[13px] font-mono text-purple-200">
                {children}
              </code>
            );
          },

          // ─── Цитаты ───
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/50 bg-white/5 pl-4 pr-3 py-3 my-4 italic text-slate-300 rounded-r-lg">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}