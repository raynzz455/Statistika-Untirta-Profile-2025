'use client'

import { useEffect, useRef } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect,
  toolbarPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  CreateLink,
  InsertImage,
  InsertThematicBreak,
  Separator,
} from '@mdxeditor/editor'

// Plugins initialized once at module level for performance
const PLUGINS: MDXEditorProps['plugins'] = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  markdownShortcutPlugin(),
  toolbarPlugin({
    toolbarContents: () => (
      <>
        <UndoRedo />
        <Separator />
        <BoldItalicUnderlineToggles options="bold italic underline" />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <ListsToggle options="both" />
        <Separator />
        <CreateLink />
        <InsertImage />
        <InsertThematicBreak />
      </>
    ),
  }),
]

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  className?: string
}

/**
 * Rich-text editor wrapper around @mdxeditor/editor.
 * Stores article content as Markdown (rendered to HTML on the read side via react-markdown).
 */
export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<MDXEditorMethods | null>(null)

  // Sync external value changes (e.g. when editing different article)
  useEffect(() => {
    if (ref.current && ref.current.getMarkdown() !== value) {
      ref.current.setMarkdown(value)
    }
  }, [value])

  return (
    <div className={`rich-text-wrapper border border-[var(--brand-ink)] bg-[var(--brand-surface)] ${className || ''}`}>
      <MDXEditor
        ref={ref}
        markdown={value}
        onChange={(md) => onChange(md)}
        placeholder={placeholder || 'Tulis artikel di sini... (Markdown didukung)'}
        contentEditableClassName="prose max-w-none min-h-[200px] p-4 focus:outline-none"
        plugins={PLUGINS}
      />
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/@mdxeditor/editor@3.39.1/style.css');
        .rich-text-wrapper .mdxeditor {
          background: var(--brand-surface);
          color: var(--brand-ink);
          border: none;
        }
        .rich-text-wrapper .mdxeditor-toolbar {
          background: var(--brand-surface-2);
          border-bottom: 1px solid var(--brand-border);
          padding: 4px;
          gap: 2px;
          flex-wrap: wrap;
        }
        .rich-text-wrapper .mdxeditor-toolbar button {
          background: transparent;
          color: var(--brand-ink);
          border: 1px solid transparent;
          padding: 4px 8px;
          border-radius: 0;
          font-size: 13px;
          min-width: 28px;
          min-height: 28px;
        }
        .rich-text-wrapper .mdxeditor-toolbar button:hover {
          background: var(--brand-pink);
          border-color: var(--brand-pink-dark);
        }
        .rich-text-wrapper .mdxeditor-toolbar button[aria-pressed='true'] {
          background: var(--brand-pink-dark);
          color: var(--brand-surface);
        }
        .rich-text-wrapper .mdxeditor-content {
          min-height: 200px;
          padding: 12px 16px;
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.6;
        }
        .rich-text-wrapper .mdxeditor-content h1 {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        .rich-text-wrapper .mdxeditor-content h2 {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0.8rem 0 0.4rem;
        }
        .rich-text-wrapper .mdxeditor-content h3 {
          font-family: var(--font-condensed);
          font-size: 1.1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0.6rem 0 0.3rem;
        }
        .rich-text-wrapper .mdxeditor-content p {
          margin: 0.5rem 0;
        }
        .rich-text-wrapper .mdxeditor-content ul,
        .rich-text-wrapper .mdxeditor-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .rich-text-wrapper .mdxeditor-content ul { list-style: disc; }
        .rich-text-wrapper .mdxeditor-content ol { list-style: decimal; }
        .rich-text-wrapper .mdxeditor-content blockquote {
          border-left: 4px solid var(--brand-pink-dark);
          padding-left: 1rem;
          margin: 0.8rem 0;
          font-style: italic;
          color: var(--brand-ink-muted);
        }
        .rich-text-wrapper .mdxeditor-content a {
          color: var(--brand-pink-dark);
          text-decoration: underline;
        }
        .rich-text-wrapper .mdxeditor-content code {
          background: var(--brand-surface-3);
          padding: 1px 4px;
          font-family: var(--font-mono, monospace);
          font-size: 0.9em;
          border: 1px solid var(--brand-border);
        }
        .rich-text-wrapper .mdxeditor-content pre {
          background: var(--brand-surface-3);
          padding: 0.75rem;
          overflow-x: auto;
          border: 1px solid var(--brand-border);
          font-size: 0.85em;
          margin: 0.5rem 0;
        }
        .rich-text-wrapper .mdxeditor-content pre code {
          background: transparent;
          border: none;
          padding: 0;
        }
        .rich-text-wrapper .mdxeditor-content img {
          max-width: 100%;
          height: auto;
          margin: 0.5rem 0;
        }
        .rich-text-wrapper .mdxeditor-content hr {
          border: none;
          border-top: 2px dashed var(--brand-border);
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}
