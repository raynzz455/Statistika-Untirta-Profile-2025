'use client'

import { ArrowLeft, Calendar, User, Tag, ArrowRight, Clock, Eye, Maximize2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '@/lib/store'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { ArticleComments } from '@/components/ArticleComments'
import { ArticleLike } from '@/components/ArticleLike'
import { ArticleBookmark } from '@/components/ArticleBookmark'
import { Lightbox, type LightboxItem } from '@/components/Lightbox'
import { ScrollReveal } from '@/components/ScrollReveal'
import { toast } from 'sonner'

interface Article {
  id: string
  title: string
  excerpt: string
  content: string | null
  date: string
  author: string
  category: string
  imageUrl: string | null
}

export function ArticleDetailView() {
  const selectedId = useAppStore((s) => s.selectedId)
  const setView = useAppStore((s) => s.setView)
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxImages, setLightboxImages] = useState<LightboxItem[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!selectedId) {
      setLoading(false)
      return
    }
    fetch(`/api/articles/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        setArticle(d.article || null)
        // Extract images from article content + cover image for lightbox
        const content = d.article?.content || ''
        const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g
        const contentImages: LightboxItem[] = []
        let match
        while ((match = imgRegex.exec(content)) !== null) {
          const url = match[1]
          // Extract alt text if present
          const altMatch = content.slice(Math.max(0, match.index - 100), match.index).match(/!\[([^\]]*)\]/)
          const alt = altMatch ? altMatch[1] : 'gambar artikel'
          contentImages.push({ id: url, src: url, alt, caption: alt })
        }
        // Add cover image as first item if exists
        if (d.article?.imageUrl) {
          contentImages.unshift({
            id: 'cover',
            src: d.article.imageUrl,
            alt: d.article.title,
            caption: d.article.title,
            category: 'Cover',
          })
        }
        setLightboxImages(contentImages)
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [selectedId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="aspect-[16/9] bg-[var(--brand-orange)]/15/40 animate-pulse mb-6" />
        <div className="h-12 bg-[var(--brand-orange)]/15/40 animate-pulse mb-4" />
        <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse mb-2" />
        <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse mb-2" />
        <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-5/6" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="font-serif text-3xl mb-4">Artikel tidak ditemukan</h2>
        <button
          onClick={() => setView('articles')}
          className="text-[var(--brand-maroon)] underline"
        >
          Kembali ke Daftar Artikel
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <button
        onClick={() => setView('articles')}
        className="inline-flex items-center text-xs uppercase tracking-widest font-bold mb-8 hover:text-[var(--brand-navy)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Artikel
      </button>

      {/* Article header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 text-[11px] font-condensed uppercase tracking-widest text-[var(--brand-ink-muted)] mb-4">
          <span className="inline-flex items-center gap-1 bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] px-2 py-1 font-bold">
            <Tag className="w-3 h-3" /> {article.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {article.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="w-3 h-3" /> {article.author}
          </span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4 text-[var(--brand-ink)]">
          {article.title}
        </h1>
        <p className="font-serif italic text-lg text-[var(--brand-ink-muted)] mb-6">{article.excerpt}</p>
      </div>

      {/* Cover image */}
      <div className="mb-8 border border-[var(--brand-ink)] shadow-hard">
        <div className="aspect-[16/9]">
          <PlaceholderImage
            alt={article.title}
            src={article.imageUrl || undefined}
            grayscale
          />
        </div>
        <p className="font-sans text-[10px] text-right text-[var(--brand-ink-muted)] uppercase tracking-widest px-3 py-2 border-t border-[var(--brand-ink)] bg-[var(--brand-surface-2)]">
          Foto: Dokumentasi Humas
        </p>
      </div>

      {/* Body — Markdown rendering */}
      <article className="article-body max-w-none">
        {(!article.content || article.content.trim().length === 0) ? (
          <p className="text-sm text-[var(--brand-ink-muted)] italic">Belum ada konten detail.</p>
        ) : (
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="font-serif text-3xl font-bold mt-6 mb-3" {...props} />,
              h2: ({ node, ...props }) => <h2 className="font-serif text-2xl font-bold mt-5 mb-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="font-condensed text-xl uppercase tracking-wide font-bold mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="font-sans text-base leading-relaxed text-[var(--brand-ink)] mb-4 first:drop-cap first:[&::first-letter]:font-serif first:[&::first-letter]:text-5xl first:[&::first-letter]:font-bold first:[&::first-letter]:float-left first:[&::first-letter]:leading-[0.85] first:[&::first-letter]:pr-2 first:[&::first-letter]:pt-1 first:[&::first-letter]:text-[var(--brand-maroon)]" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="font-sans text-base text-[var(--brand-ink)]" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[var(--brand-orange)] pl-4 my-4 italic text-[var(--brand-ink-muted)] font-serif text-lg" {...props} />,
              a: ({ node, ...props }) => <a className="text-[var(--brand-orange)] underline hover:no-underline" target="_blank" rel="noopener noreferrer" {...props} />,
              code: ({ node, className, children, ...props }) => {
                const isInline = !className
                if (isInline) {
                  return <code className="bg-[var(--brand-surface-3)] px-1 py-0.5 text-sm border border-[var(--brand-border)] font-mono" {...props}>{children}</code>
                }
                return <code className={className} {...props}>{children}</code>
              },
              pre: ({ node, ...props }) => <pre className="bg-[var(--brand-surface-3)] p-4 my-3 overflow-x-auto border border-[var(--brand-border)] text-sm" {...props} />,
              img: ({ node, alt, src, ...props }) => {
                const imgSrc = typeof src === 'string' ? src : ''
                const imgAlt = alt || 'gambar artikel'
                return (
                  <span className="relative inline-block group my-4 cursor-zoom-in" onClick={() => {
                    if (imgSrc) {
                      const idx = lightboxImages.findIndex((i) => i.src === imgSrc)
                      setLightboxIndex(idx >= 0 ? idx : 0)
                    }
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={imgAlt} src={imgSrc} className="max-w-full h-auto border border-[var(--brand-ink)] shadow-hard" {...props} />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--brand-surface)] text-[var(--brand-ink)] px-3 py-1.5 text-[10px] uppercase tracking-widest font-condensed flex items-center gap-1 border border-[var(--brand-ink)] shadow-hard">
                        <Maximize2 className="w-3 h-3" /> Perbesar
                      </span>
                    </span>
                  </span>
                )
              },
              hr: () => <hr className="border-none border-t-2 border-dashed border-[var(--brand-border)] my-6" />,
              strong: ({ node, ...props }) => <strong className="font-bold text-[var(--brand-ink)]" {...props} />,
              em: ({ node, ...props }) => <em className="italic" {...props} />,
            }}
          >
            {article.content}
          </ReactMarkdown>
        )}
      </article>

      {/* Article actions bar — like + bookmark + reading time */}
      <div className="mt-8 mb-4 flex items-center justify-between gap-4 border-y border-[var(--brand-border)] py-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ArticleLike articleId={article.id} size="lg" />
          <ArticleBookmark articleId={article.id} size="lg" />
          <div className="flex items-center gap-1.5 text-xs text-[var(--brand-ink-muted)] font-condensed uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            Baca ~{Math.max(1, Math.ceil((article.content || article.excerpt).split(/\s+/).length / 200))} mnt
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--brand-ink-muted)] font-condensed uppercase tracking-widest">
          <Eye className="w-3.5 h-3.5" />
          Dilihat {Math.floor(Math.random() * 90) + 10}×
        </div>
      </div>

      {/* Share / CTA */}
      <div className="mt-8 border-t border-[var(--brand-ink)] pt-8 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12">
            <PlaceholderImage
              alt={`Foto ${article.author}`}
              src={undefined}
              grayscale
            />
          </div>
          <div>
            <p className="font-condensed text-xs uppercase tracking-widest text-[var(--brand-ink-muted)]">Ditulis oleh</p>
            <p className="font-serif font-bold text-lg">{article.author}</p>
          </div>
        </div>
        <button
          onClick={() => setView('articles')}
          className="self-end inline-flex items-center gap-2 bg-[var(--brand-ink)] text-white px-6 py-3 font-condensed uppercase tracking-widest text-sm font-bold hover:bg-[var(--brand-maroon)] transition-colors"
        >
          Artikel Lainnya <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Comments section */}
      <ArticleComments articleId={article.id} />

      {/* Image lightbox for inline article images */}
      <Lightbox
        items={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  )
}
