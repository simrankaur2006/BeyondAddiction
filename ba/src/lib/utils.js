export const iso = (d = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return x.toISOString().slice(0, 10)
}
export const todayISO = () => iso(new Date())
export const addDays = (dateStr, n) => { const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d) }
export const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000)
export const fmtDate = (s) => new Date(s.length === 10 ? s + 'T00:00:00' : s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtShort = (s) => new Date(s + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
export const fmtTime = (s) => new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const cx = (...c) => c.filter(Boolean).join(' ')
export const avg = (arr) => { const v = arr.filter((x) => typeof x === 'number'); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null }
export const range = (from, to) => { const out = []; for (let d = from; d <= to; d = addDays(d, 1)) out.push(d); return out }

/** Check-in streak: consecutive calendar days with a check-in, ending today (or yesterday, so today is not yet "missed"). A gap resets the streak; it says nothing about relapse. */
export function checkInStreak(dates) {
  const set = new Set(dates)
  let cursor = set.has(todayISO()) ? todayISO() : addDays(todayISO(), -1)
  let n = 0
  while (set.has(cursor)) { n += 1; cursor = addDays(cursor, -1) }
  return n
}
/** Days of progress since the later of: recovery start date or the most recent self-reported setback. */
export function progressDays(startDate, setbackDates) {
  const last = [startDate, ...setbackDates].filter(Boolean).sort().pop()
  if (!last) return null
  return Math.max(0, daysBetween(last, todayISO()))
}
export function youtubeId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') return u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
  } catch { /* not a URL */ }
  return null
}
export function downloadJSON(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
