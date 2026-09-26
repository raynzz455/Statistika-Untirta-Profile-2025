'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Trash2, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'

interface CommentUser {
  id: string
  username: string
  displayName: string | null
  role: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: CommentUser
}

export function ArticleComments({ articleId }: { articleId: string }) {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const load = () => {
    setLoading(true)
    fetch(`/api/articles/${articleId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [articleId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Anda harus login untuk berkomentar.')
      return
    }
    const trimmed = content.trim()
    if (!trimmed) return
    if (trimmed.length > 500) {
      toast.error('Komentar maksimal 500 karakter.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      const d = await res.json()
      if (d.error) {
        toast.error(d.error)
        return
      }
      setContent('')
      setComments((prev) => [...prev, d.comment])
      toast.success('Komentar ditambahkan!')
      // Reset textarea height
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch {
      toast.error('Gagal menambah komentar.')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (commentId: string) => {
    if (!confirm('Hapus komentar ini?')) return
    const res = await fetch(`/api/articles/${articleId}/comments?commentId=${commentId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success('Komentar dihapus.')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'Gagal menghapus.')
    }
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return iso
    }
  }

  // Auto-resize textarea
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    const t = e.target
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 200) + 'px'
  }

  return (
    <section className="mt-16 border-t-2 border-dashed border-[var(--brand-ink)] pt-10">
      <h3 className="font-condensed text-2xl uppercase tracking-tight flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-[var(--brand-orange)]" />
        Komentar
        <span className="text-sm text-[var(--brand-ink-muted)] font-normal ml-1">
          ({comments.length})
        </span>
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={submit} className="mb-8">
          <div className="border border-[var(--brand-ink)] bg-[var(--brand-surface-2)]">
            <div className="px-3 py-2 border-b border-[var(--brand-border)] bg-[var(--brand-orange)]/15/30 flex items-center justify-between">
              <p className="text-xs font-condensed uppercase tracking-widest">
                Berkomentar sebagai <span className="text-[var(--brand-orange)]">{user.displayName || user.username}</span>
              </p>
              <span className={`text-[9px] uppercase tracking-widest font-condensed px-1.5 py-0.5 ${user.role === 'admin' ? 'bg-[var(--brand-maroon)] text-white' : 'bg-[var(--brand-orange)] text-[var(--brand-surface)]'}`}>
                {user.role}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={onInput}
              disabled={submitting}
              rows={3}
              placeholder="Tulis komentar sopan & relevan dengan artikel..."
              className="w-full px-3 py-3 text-sm bg-[var(--brand-surface)] focus:outline-none resize-none placeholder:text-[var(--brand-ink-muted)] disabled:opacity-50"
            />
            <div className="px-3 py-2 border-t border-[var(--brand-border)] bg-[var(--brand-surface-2)] flex items-center justify-between">
              <p className="text-[10px] text-[var(--brand-ink-muted)]">
                {content.length}/500 karakter
              </p>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="inline-flex items-center gap-1.5 bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors disabled:opacity-40"
              >
                <Send className="w-3 h-3" /> {submitting ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 border border-dashed border-[var(--brand-ink)]/40 bg-[var(--brand-surface-2)] text-center">
          <p className="text-sm text-[var(--brand-ink-muted)]">
            <button
              onClick={() => setView('login')}
              className="text-[var(--brand-orange)] hover:underline font-bold"
            >
              Login
            </button>{' '}
            untuk meninggalkan komentar.
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-[var(--brand-border)] p-3 bg-[var(--brand-surface-2)]">
              <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-1/3 mb-2" />
              <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse mb-1" />
              <div className="h-3 bg-[var(--brand-orange)]/15/40 animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--brand-ink)]/30">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--brand-ink-muted)]/50" />
          <p className="font-serif italic text-lg text-[var(--brand-ink-muted)] mb-1">
            Belum ada komentar
          </p>
          <p className="text-sm text-[var(--brand-ink-muted)]">
            Jadilah yang pertama berkomentar!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="border border-[var(--brand-border)] p-4 bg-[var(--brand-surface-2)] hover:border-[var(--brand-ink)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 flex-shrink-0 bg-[var(--brand-orange)]/15 border border-[var(--brand-ink)] flex items-center justify-center font-condensed text-xs uppercase">
                    {(c.user.displayName || c.user.username).slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-condensed text-sm truncate">
                      {c.user.displayName || c.user.username}
                      {c.user.role === 'admin' && (
                        <span className="ml-2 text-[9px] uppercase tracking-widest bg-[var(--brand-maroon)] text-white px-1.5 py-0.5 font-bold">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-[var(--brand-ink-muted)]">{formatDate(c.createdAt)}</p>
                  </div>
                </div>
                {user && (user.id === c.user.id || user.role === 'admin') && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-[var(--brand-ink-muted)] hover:text-[var(--brand-maroon)] p-1"
                    title="Hapus"
                    aria-label="Hapus komentar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-[var(--brand-ink)] whitespace-pre-wrap break-words">
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
