import { createElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Project descriptions rendered with GFM, styled against the design tokens
// (no typography plugin — prose styles map onto surface/ink/line/project).
// Server component: markdown renders at request time, ships as HTML.

// react-markdown passes a `node` prop that must not reach the DOM. The
// parameter type stays minimal so the components stay assignable to every
// element slot; the cast recovers the rest of the props for spreading.
function styled(tag: string, className: string, extra?: Record<string, unknown>) {
  return function MarkdownElement(props: { node?: unknown }) {
    const { node, ...rest } = props as { node?: unknown } & Record<string, unknown>;
    void node;
    return createElement(tag, { ...rest, ...extra, className });
  };
}

const components: Components = {
  h1: styled("h2", "mt-8 mb-3 text-2xl font-semibold text-ink first:mt-0"),
  h2: styled("h3", "mt-7 mb-3 text-xl font-semibold text-ink first:mt-0"),
  h3: styled("h4", "mt-6 mb-2 text-lg font-semibold text-ink first:mt-0"),
  h4: styled("h5", "mt-5 mb-2 text-base font-semibold text-ink first:mt-0"),
  h5: styled("h6", "mt-4 mb-2 text-sm font-semibold text-ink first:mt-0"),
  h6: styled("h6", "mt-4 mb-2 text-sm font-medium text-muted first:mt-0"),
  p: styled("p", "my-3 leading-relaxed text-ink first:mt-0"),
  a: styled(
    "a",
    "font-medium text-project underline underline-offset-2 transition-colors hover:text-action",
    { target: "_blank", rel: "noreferrer" },
  ),
  ul: styled("ul", "my-3 list-disc space-y-1 pl-6 text-ink"),
  ol: styled("ol", "my-3 list-decimal space-y-1 pl-6 text-ink"),
  li: styled("li", "leading-relaxed"),
  blockquote: styled("blockquote", "my-4 border-l-2 border-line pl-4 text-muted italic"),
  code: styled("code", "rounded bg-line/60 px-1.5 py-0.5 font-mono text-[0.85em] text-ink"),
  pre: styled(
    "pre",
    "my-4 overflow-x-auto rounded-xl bg-mp-ink p-4 text-sm text-mp-white [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-mp-white",
  ),
  hr: styled("hr", "my-6 border-line"),
  img: styled("img", "my-4 max-w-full rounded-xl"),
  table(props: { node?: unknown }) {
    const { node, ...rest } = props as { node?: unknown } & Record<string, unknown>;
    void node;
    return (
      <div className="my-4 overflow-x-auto">
        <table {...rest} className="w-full border-collapse text-sm" />
      </div>
    );
  },
  th: styled("th", "border-b border-line px-3 py-2 text-left font-semibold text-ink"),
  td: styled("td", "border-b border-line/60 px-3 py-2 text-ink"),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="min-w-0 text-[0.9375rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
