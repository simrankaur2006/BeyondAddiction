import { Link } from 'react-router-dom'
import { ShieldCheck, CalendarCheck, Target, BookText, BarChart3, Users, Library, Lock, HeartHandshake } from 'lucide-react'
import { PublicHeader, Footer } from '../layouts/PublicLayout'
import { Disclaimer } from '../components/ui'

const FEATURES = [
  [CalendarCheck, 'Daily check-in', 'Note mood, stress, cravings and triggers in under a minute. Skip any field you like.'],
  [Target, 'Goals and habits', 'Set measurable goals, tick off each day and watch progress build from your own records.'],
  [BookText, 'Private journal', 'Write freely. Entries are visible only to you, protected at the database level.'],
  [BarChart3, 'Your own trends', 'Charts of mood, cravings and triggers help you notice patterns. They describe, never diagnose.'],
  [Library, 'Curated resources', 'Direct links to videos from health agencies and educators. Save the ones that help.'],
  [Users, 'Peer support', 'Browse trusted external communities, or join the moderated in-app feed if you choose to.'],
]
const FAQ = [
  ['Is this treatment?', 'No. Beyond Addiction offers education, self-tracking and peer-support links. It does not diagnose or treat any condition. If you are struggling, a doctor or counsellor can help, and the Help page lists urgent contacts.'],
  ['Who can see my check-ins and journal?', 'Only you. These records are protected by row-level security in the database. Nothing from them appears in the community feed.'],
  ['Does a missed check-in mean I relapsed?', 'No. A streak only counts consecutive check-in days. Setbacks are recorded only when you choose to record one, and the language stays non-judgemental.'],
  ['Do I have to join the community?', 'No. The feed is optional, and you control what you post. Your display name is the only profile detail shown with a post.'],
  ['Can I delete my data?', 'Yes. Settings lets you download everything as JSON or delete your account and all its records.'],
]
export default function Landing() {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <PublicHeader />
      <section className="grid w-full items-center gap-10 bg-forest-800 px-6 py-16 text-white sm:px-12 lg:grid-cols-2 lg:py-24">
        <div className="max-w-xl">
          <h1 className="!text-white text-4xl font-bold leading-tight sm:text-5xl">Change a habit at your own pace, with your own data.</h1>
          <p className="mt-5 text-lg text-forest-100">Beyond Addiction is a private space to track how you are doing, understand your triggers, learn from trusted sources and find people who get it.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn bg-white text-forest-800 hover:bg-forest-50 !px-6 !py-3 text-base">Get started</Link>
            <Link to="/resources" className="btn border border-white/40 text-white hover:bg-white/10 !px-6 !py-3 text-base">Explore resources</Link>
          </div>
          <p className="mt-4 text-sm text-forest-200">Free. No fake streaks, no pressure.</p>
        </div>
        <div className="mx-auto w-full max-w-md" aria-hidden="true">
          <svg viewBox="0 0 400 300" className="w-full"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#2bb3a6" /><stop offset="1" stopColor="#78b49b" /></linearGradient></defs>
            {[130, 100, 70, 40].map((r, i) => <circle key={r} cx="200" cy="170" r={r} fill="none" stroke="url(#g)" strokeOpacity={0.25 + i * 0.18} strokeWidth="2" />)}
            <path d="M150 220c40-8 62-52 50-150 28 80 52 134 100 150-52 24-108 24-150 0z" fill="#faf7f0" /><path d="M200 70v150" stroke="#1f5f4c" strokeWidth="3" /></svg>
        </div>
      </section>
      <section className="w-full px-6 py-16 sm:px-12">
        <h2 className="max-w-2xl text-3xl font-bold">Tools that stay useful on ordinary days</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, t, d]) => (<div key={t} className="card"><Icon className="text-teal2-600" /><h3 className="mt-3 text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-neutral-700">{d}</p></div>))}
        </div>
      </section>
      <section className="grid w-full gap-8 bg-sand px-6 py-16 sm:px-12 lg:grid-cols-3">
        <div className="lg:col-span-1"><h2 className="text-3xl font-bold">Our approach</h2><p className="mt-3 text-sm text-neutral-700">Small, honest records beat perfect streaks. The app reflects back what you enter and points to evidence-informed material from reputable organisations.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <div className="card"><Lock className="text-teal2-600" /><h3 className="mt-2 font-bold">Private by default</h3><p className="text-sm text-neutral-700">Personal records are readable only by you. You choose whether to use the community.</p></div>
          <div className="card"><ShieldCheck className="text-teal2-600" /><h3 className="mt-2 font-bold">You stay in control</h3><p className="text-sm text-neutral-700">Skip any question, edit preferences, export or delete your data at any time.</p></div>
          <div className="card"><HeartHandshake className="text-teal2-600" /><h3 className="mt-2 font-bold">Setbacks are information</h3><p className="text-sm text-neutral-700">Record one without shame. Your progress count restarts from that day, and everything you have built stays.</p></div>
          <div className="card"><Users className="text-teal2-600" /><h3 className="mt-2 font-bold">Real communities</h3><p className="text-sm text-neutral-700">Links to established fellowships and agencies, clearly labelled as third parties.</p></div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <h2 className="text-3xl font-bold">Questions</h2>
        <div className="mt-6 divide-y divide-forest-100 rounded-xl border border-forest-100 bg-white">
          {FAQ.map(([q, a]) => (<details key={q} className="group p-4"><summary className="cursor-pointer font-semibold text-forest-900">{q}</summary><p className="mt-2 text-sm text-neutral-700">{a}</p></details>))}
        </div>
        <div className="mt-8"><Disclaimer /></div>
      </section>
      <Footer />
    </div>
  )
}
