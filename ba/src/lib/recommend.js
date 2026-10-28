import { CATEGORY_RESOURCE_MAP } from './constants'
import { avg } from './utils'

/** Transparent rule-based suggestions. Each point and reason is shown to the user. No AI involved. */
export function recommend(resources, { profile, goals = [], saved = new Set(), checkIns = [] }, limit = 4) {
  const cats = new Map()
  const add = (c, pts, why) => { const e = cats.get(c) || { pts: 0, why: [] }; e.pts += pts; e.why.push(why); cats.set(c, e) }
  if (profile?.habit_category) (CATEGORY_RESOURCE_MAP[profile.habit_category] || []).forEach((c) => add(c, 3, 'matches your chosen habit'))
  ;(profile?.interests || []).forEach((c) => add(c, 3, 'a topic you picked'))
  goals.filter((g) => g.status === 'active').forEach((g) => (CATEGORY_RESOURCE_MAP[g.category] || []).forEach((c) => add(c, 2, 'relates to one of your goals')))
  const recent = checkIns.slice(0, 7)
  if (recent.length >= 3) {
    if ((avg(recent.map((c) => c.craving)) ?? 0) >= 6) add('Craving management', 2, 'your recent cravings were high')
    if ((avg(recent.map((c) => c.stress)) ?? 0) >= 4) { add('Stress management', 2, 'your recent stress was high'); add('Mindfulness and meditation', 1, 'your recent stress was high') }
  }
  const savedCats = new Set(resources.filter((r) => saved.has(r.id)).map((r) => r.category))
  savedCats.forEach((c) => add(c, 1, 'similar to something you saved'))
  return resources.filter((r) => !saved.has(r.id) && cats.has(r.category))
    .map((r) => ({ ...r, score: cats.get(r.category).pts + (r.featured ? 0.5 : 0), reasons: [...new Set(cats.get(r.category).why)] }))
    .sort((a, b) => b.score - a.score).slice(0, limit)
}
