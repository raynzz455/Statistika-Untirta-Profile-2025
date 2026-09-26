import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/events/[id]/ical — download .ics file for calendar import
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const event = await db.event.findUnique({ where: { id } })
  if (!event) {
    return new NextResponse('Event tidak ditemukan.', { status: 404 })
  }

  // Parse startDate/endDate strings (Indonesian format: "28 Okt 2025, 08:00")
  // into proper Date objects for ICS DTSTART/DTEND
  const parseDate = (str: string): Date | null => {
    if (!str) return null
    try {
      // Map Indonesian month abbreviations to numbers
      const monthMap: Record<string, string> = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'mei': '05', 'jun': '06', 'jul': '07', 'agu': '08', 'aug': '08',
        'sep': '09', 'okt': '10', 'oct': '10', 'nov': '11', 'des': '12', 'dec': '12',
      }
      // Format: "28 Okt 2025, 08:00" or "28 Oct 2025"
      const match = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/)
      if (!match) return null
      const [, day, mon, year, hh, mm] = match
      const month = monthMap[mon.toLowerCase().slice(0, 3)]
      if (!month) return null
      const hour = hh || '08'
      const minute = mm || '00'
      // Format: YYYYMMDDTHHMMSS (local time, no Z)
      return new Date(`${year}-${month}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`)
    } catch {
      return null
    }
  }

  const start = parseDate(event.startDate)
  const end = event.endDate ? parseDate(event.endDate) : (start ? new Date(start.getTime() + 60 * 60 * 1000) : null)

  const fmtICS = (d: Date): string => {
    // Format as YYYYMMDDTHHMMSSZ (UTC)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  }

  const dtStart = start ? fmtICS(start) : ''
  const dtEnd = end ? fmtICS(end) : ''
  const dtStamp = fmtICS(new Date())

  // Escape text for ICS (commas, semicolons, newlines)
  const escapeICS = (text: string) => text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Statistika 25//Event Export//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@statistika25.untirta`,
    `DTSTAMP:${dtStamp}`,
    dtStart && `DTSTART:${dtStart}`,
    dtEnd && `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.description && `DESCRIPTION:${escapeICS(event.description)}`,
    event.location && `LOCATION:${escapeICS(event.location)}`,
    `CATEGORIES:${escapeICS(event.category)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${event.id.slice(-8)}.ics"`,
    },
  })
}
