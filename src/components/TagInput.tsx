'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Tag as TagIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[] // array of tag names
  onChange: (tags: string[]) => void
  label?: string
  hint?: string
}

// Predefined color palette for new tags
const TAG_COLORS = ['var(--brand-orange)', '#5d8fb5', 'var(--brand-navy)', '#b58200', '#0a7a3f', '#6b46c1', '#dc2626', '#0891b2']

export function TagInput({ value, onChange, label = 'Tag', hint }: TagInputProps) {
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Load existing tags for suggestions
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((d) => setAllTags(d.tags || []))
      .catch(() => {})
  }, [])

  const addTag = (name: string) => {
    const clean = name.trim().toLowerCase()
    if (!clean || value.includes(clean)) return
    onChange([...value, clean])
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const suggestions = allTags
    .filter((t) => !value.includes(t.name))
    .filter((t) => !input || t.name.includes(input.toLowerCase()))
    .slice(0, 6)

  // Get color for a tag name (from existing tag or pick from palette based on name hash)
  const getColor = (name: string): string => {
    const existing = allTags.find((t) => t.name === name)
    if (existing) return existing.color
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return TAG_COLORS[hash % TAG_COLORS.length]
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-condensed uppercase font-bold flex items-center gap-2">
          <TagIcon className="w-3 h-3" /> {label}
        </label>
      )}

      <div className="relative">
        <div
          className="flex flex-wrap gap-1.5 p-2 border border-[var(--brand-ink)] bg-[var(--brand-surface)] min-h-[42px] cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag) => {
            const color = getColor(tag)
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] uppercase tracking-widest font-condensed border text-white"
                style={{ backgroundColor: color, borderColor: color }}
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTag(tag)
                  }}
                  className="hover:bg-black/20 rounded-full p-0.5"
                  aria-label={`Hapus tag ${tag}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )
          })}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={onKeyDown}
            placeholder={value.length === 0 ? 'Ketik tag + Enter (cth: data-science, mahasiswa-baru)' : ''}
            className="flex-grow min-w-[120px] bg-transparent text-sm focus:outline-none placeholder:text-[var(--brand-ink-muted)]"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[var(--brand-surface)] border border-[var(--brand-ink)] shadow-hard-lg max-h-48 overflow-y-auto custom-scroll">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addTag(tag.name)
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--brand-orange)]/15 flex items-center gap-2 border-b border-[var(--brand-border)] last:border-0"
              >
                <span
                  className="w-3 h-3 rounded-full border border-[var(--brand-ink)]"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-condensed uppercase tracking-wider">{tag.name}</span>
                {tag.count !== undefined && (
                  <span className="ml-auto text-[10px] text-[var(--brand-ink-muted)]">{tag.count}×</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {hint && <p className="text-[10px] text-[var(--brand-ink-muted)]">{hint}</p>}
    </div>
  )
}
