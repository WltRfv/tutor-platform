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
          p: ({ children }) => (
            <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === 'string' ? src : ''}
              alt={alt || ''}
              className="rounded-xl border border-white/10 my-3 max-h-[600px] object-contain"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-white/10 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/10 px-3 py-2 align-top">
              {children}
            </td>
          ),
          code: ({ children, className: codeClass }) => {
            const isBlock = (codeClass || '').includes('language-');
            if (isBlock) {
              return (
                <pre className="bg-slate-950/80 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-200 overflow-x-auto my-3">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-purple-200">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/40 bg-white/5 pl-4 py-2 my-3 italic text-slate-300">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mt-5 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white mt-3 mb-1.5">{children}</h3>
          ),
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
          hr: () => <hr className="border-white/10 my-4" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}