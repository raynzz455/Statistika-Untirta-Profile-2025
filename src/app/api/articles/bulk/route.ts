import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/articles/bulk — bulk publish/unpublish/delete (admin only)
// Body: { ids: string[], action: 'publish' | 'unpublish' | 'delete' }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []
    const action = body?.action

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal 1 artikel.' }, { status: 400 })
    }
    if (!['publish', 'unpublish', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 })
    }

    let result
    if (action === 'publish') {
      result = await db.article.updateMany({
        where: { id: { in: ids } },
        data: { published: true },
      })
    } else if (action === 'unpublish') {
      result = await db.article.updateMany({
        where: { id: { in: ids } },
        data: { published: false },
      })
    } else if (action === 'delete') {
      // Cascade delete related likes, comments, bookmarks first
      await db.like.deleteMany({ where: { articleId: { in: ids } } })
      await db.comment.deleteMany({ where: { articleId: { in: ids } } })
      await db.bookmark.deleteMany({ where: { articleId: { in: ids } } })
      await db.articleTag.deleteMany({ where: { articleId: { in: ids } } })
      result = await db.article.deleteMany({
        where: { id: { in: ids } },
      })
    }

    return NextResponse.json({
      ok: true,
      action,
      affected: result?.count || 0,
    })
  } catch (e: any) {
    console.error('[api/articles/bulk POST] error:', e?.message?.slice(0, 200))
    return NextResponse.json(
      { error: 'Gagal memproses aksi bulk. Coba lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
