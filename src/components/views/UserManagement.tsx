'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Plus, Trash2, Edit2, Shield, User, X, Key, Crown } from 'lucide-react'
import { toast } from 'sonner'

interface UserItem {
  id: string
  username: string
  role: 'admin' | 'user'
  displayName: string | null
  createdAt: string
  _count: {
    articles: number
    events: number
    galleryItems: number
    students: number
  }
}

export function UserManagement() {
  const me = useAppStore((s) => s.user)
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [pwModal, setPwModal] = useState<UserItem | null>(null)
  const [addForm, setAddForm] = useState({ username: '', password: '', role: 'user' as 'user' | 'admin', displayName: '' })
  const [pwForm, setPwForm] = useState({ password: '' })

  const load = () => {
    setLoading(true)
    fetch('/api/users', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast.error(d.error)
          setUsers([])
        } else {
          setUsers(d.users || [])
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/users', { cache: 'no-store',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const d = await res.json()
    if (d.error) return toast.error(d.error)
    toast.success(`User "${d.user.username}" ditambahkan!`)
    setAddForm({ username: '', password: '', role: 'user', displayName: '' })
    setShowAdd(false)
    load()
  }

  const changeRole = async (u: UserItem, newRole: 'admin' | 'user') => {
    if (u.id === me?.id) return toast.error('Tidak dapat mengubah role diri sendiri.')
    const res = await fetch(`/api/users/${u.id}`, { cache: 'no-store',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    const d = await res.json()
    if (d.error) return toast.error(d.error)
    toast.success(`${u.username} sekarang ${newRole === 'admin' ? 'Admin' : 'User'}.`)
    load()
  }

  const deleteUser = async (u: UserItem) => {
    if (u.id === me?.id) return toast.error('Tidak dapat menghapus diri sendiri.')
    if (!confirm(`Hapus user "${u.username}"? User akan kehilangan akses tapi data artikel/event/gallery miliknya tetap ada.`)) return
    const res = await fetch(`/api/users/${u.id}`, { cache: 'no-store', method: 'DELETE' })
    const d = await res.json().catch(() => ({}))
    if (!res.ok || d.error) return toast.error(d.error || 'Gagal menghapus.')
    toast.success(`User "${u.username}" dihapus.`)
    load()
  }

  const resetPw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwModal) return
    if (pwForm.password.length < 4) return toast.error('Password minimal 4 karakter.')
    const res = await fetch(`/api/users/${pwModal.id}`, { cache: 'no-store',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwForm.password }),
    })
    const d = await res.json()
    if (d.error) return toast.error(d.error)
    toast.success(`Password ${pwModal.username} direset.`)
    setPwModal(null)
    setPwForm({ password: '' })
  }

  return (
    <div className="mt-12 border-t-2 border-dashed border-[var(--brand-ink)] pt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="font-condensed text-3xl uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--brand-maroon)]" /> Manajemen User
          </h2>
          <p className="font-body text-sm text-[var(--brand-ink-muted)] mt-1">
            Kelola akun anggota: tambah user, ubah role (admin/user), reset password, atau hapus.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 bg-[var(--brand-ink)] text-[var(--brand-surface)] px-4 py-2 font-condensed uppercase tracking-widest text-xs font-bold hover:bg-[var(--brand-maroon)] transition-colors"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Tutup' : 'Tambah User'}
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <form
          onSubmit={addUser}
          className="mb-6 border border-[var(--brand-ink)] p-6 bg-[var(--brand-surface-2)] shadow-hard"
        >
          <h3 className="font-condensed text-xl uppercase mb-4">Tambah User Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Username</label>
              <input
                type="text"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="cth: budi"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Password</label>
              <input
                type="text"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="min. 4 karakter"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as 'user' | 'admin' })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
              >
                <option value="user">User (Mahasiswa)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase font-bold mb-1">Nama Tampilan</label>
              <input
                type="text"
                value={addForm.displayName}
                onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                className="w-full border border-[var(--brand-ink)] p-2 text-sm bg-[var(--brand-surface)]"
                placeholder="opsional"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand-ink)] text-[var(--brand-surface)] text-xs uppercase font-condensed hover:bg-[var(--brand-maroon)]"
            >
              Tambah User
            </button>
          </div>
        </form>
      )}

      {/* Users table */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[var(--brand-ink-muted)]">Memuat daftar user...</div>
      ) : (
        <div className="overflow-x-auto border border-[var(--brand-ink)]">
          <table className="w-full text-left text-sm font-body">
            <thead className="bg-[var(--brand-orange)]/15 font-condensed uppercase tracking-wider text-xs">
              <tr>
                <th className="p-3 border-b border-[var(--brand-ink)]">Username</th>
                <th className="p-3 border-b border-[var(--brand-ink)]">Nama</th>
                <th className="p-3 border-b border-[var(--brand-ink)]">Role</th>
                <th className="p-3 border-b border-[var(--brand-ink)] text-center">Konten</th>
                <th className="p-3 border-b border-[var(--brand-ink)] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--brand-surface-2)]">
                  <td className="p-3 font-bold flex items-center gap-2">
                    {u.role === 'admin' ? (
                      <Crown className="w-4 h-4 text-[var(--brand-maroon)]" />
                    ) : (
                      <User className="w-4 h-4 text-[var(--brand-ink-muted)]" />
                    )}
                    {u.username}
                    {u.id === me?.id && (
                      <span className="text-[9px] uppercase tracking-widest font-condensed bg-[var(--brand-orange)] text-[var(--brand-surface)] px-1.5 py-0.5">
                        Anda
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[var(--brand-ink-muted)]">{u.displayName || '—'}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as 'admin' | 'user')}
                      disabled={u.id === me?.id}
                      className="border border-[var(--brand-ink)] px-2 py-1 text-xs font-condensed uppercase font-bold bg-[var(--brand-surface)] disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-center text-xs text-[var(--brand-ink-muted)]">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {u._count.articles > 0 && (
                        <span className="bg-[var(--brand-orange)]/15 border border-[var(--brand-orange)] px-1.5 py-0.5">
                          {u._count.articles} A
                        </span>
                      )}
                      {u._count.events > 0 && (
                        <span className="bg-[var(--brand-navy)]/15 border border-[var(--brand-navy)] px-1.5 py-0.5">
                          {u._count.events} E
                        </span>
                      )}
                      {u._count.galleryItems > 0 && (
                        <span className="bg-[var(--brand-surface-3)] border border-[var(--brand-ink)] px-1.5 py-0.5">
                          {u._count.galleryItems} G
                        </span>
                      )}
                      {u._count.students > 0 && (
                        <span className="bg-[var(--brand-surface-2)] border border-[var(--brand-ink)] px-1.5 py-0.5">
                          {u._count.students} S
                        </span>
                      )}
                      {u._count.articles + u._count.events + u._count.galleryItems + u._count.students === 0 && (
                        <span className="italic">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => {
                          setPwModal(u)
                          setPwForm({ password: '' })
                        }}
                        className="w-7 h-7 flex items-center justify-center border border-[var(--brand-ink)] hover:bg-[var(--brand-ink)] hover:text-[var(--brand-surface)] transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={u.id === me?.id}
                        className="w-7 h-7 flex items-center justify-center border border-[var(--brand-maroon)] text-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)] hover:text-[var(--brand-surface)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[var(--brand-ink-muted)]">Belum ada user terdaftar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset password modal */}
      {pwModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPwModal(null)}
        >
          <form
            onSubmit={resetPw}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--brand-surface)] border border-[var(--brand-ink)] shadow-hard-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--brand-border)]">
              <h3 className="font-condensed text-xl uppercase flex items-center gap-2">
                <Key className="w-5 h-5" /> Reset Password
              </h3>
              <button type="button" onClick={() => setPwModal(null)} aria-label="Tutup">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mb-4">
              Reset password untuk user <strong className="font-condensed uppercase">{pwModal.username}</strong>. User akan logout dari semua sesi aktif.
            </p>
            <input
              type="text"
              autoFocus
              value={pwForm.password}
              onChange={(e) => setPwForm({ password: e.target.value })}
              placeholder="Password baru (min. 4 karakter)"
              className="w-full border border-[var(--brand-ink)] p-2.5 text-sm bg-[var(--brand-surface-2)] mb-4 focus:outline-none focus:border-[var(--brand-maroon)]"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPwModal(null)}
                className="px-4 py-2 text-xs uppercase font-condensed text-[var(--brand-ink-muted)] hover:text-[var(--brand-ink)]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--brand-ink)] text-[var(--brand-surface)] text-xs uppercase font-condensed hover:bg-[var(--brand-maroon)]"
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
