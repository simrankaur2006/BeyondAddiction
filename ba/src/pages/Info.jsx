import { Phone, AlertTriangle } from 'lucide-react'
import { PageHeader, ExternalLink, Disclaimer } from '../components/ui'

const LINES = [
  ['India', [['Emergency services', '112'], ['Tele-MANAS (24/7 mental health support)', '14416'], ['Nasha Mukt Bharat Abhiyaan helpline', '14446']]],

]
export function Help() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title="Help and support" subtitle="If something feels urgent, reach out to a person now." />
      <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="note"><AlertTriangle className="shrink-0" size={20} /><p><strong>In immediate danger, or thinking about harming yourself?</strong> Call your local emergency number now (112 in India, 911 in the US), or go to the nearest emergency room. Withdrawal from alcohol or some drugs can be medically dangerous; seek medical help before stopping suddenly.</p></div>
      <div className="grid gap-4 md:grid-cols-2">{LINES.map(([region, items]) => (
        <section key={region} className="card"><h2 className="text-lg font-bold">{region}</h2><ul className="mt-3 space-y-3 text-sm">{items.map(([n, num]) => <li key={n} className="flex items-start gap-2"><Phone size={16} className="mt-0.5 text-teal2-600" /><span><span className="block font-semibold">{num}</span>{n}</span></li>)}</ul></section>))}</div>
      <p className="mt-3 text-xs text-neutral-500">Numbers can change. Please confirm them on the official sites below before relying on them, and look up local services if you are elsewhere.</p>
      <section className="card mt-6"><h2 className="text-lg font-bold">Find professional help</h2><div className="mt-3 flex flex-wrap gap-2"><ExternalLink href="https://nmba.dosje.gov.in/">Nasha Mukt Bharat Abhiyaan</ExternalLink><ExternalLink href="https://smokefree.gov/">Smokefree.gov</ExternalLink><ExternalLink href="https://www.who.int/">World Health Organization</ExternalLink></div></section>
      <section className="card mt-6"><h2 className="text-lg font-bold">Using this app</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700"><li><strong>Check-in</strong>: one entry per day; re-saving edits it.</li><li><strong>Goals</strong>: mark days done; progress is logged days divided by your target.</li><li><strong>Journal</strong>: private to you, searchable by text, date and tag.</li><li><strong>Community</strong>: optional. Report anything that worries you.</li><li><strong>Settings</strong>: edit preferences, export or delete your data.</li></ul></section>
      <div className="mt-6"><Disclaimer /></div>
    </div>
  )
}
export function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 text-sm text-neutral-800">
      <h1 className="text-3xl font-bold">Privacy and terms</h1>
      <p>This is a student project. It has not undergone a formal privacy or regulatory assessment and makes no compliance claims.</p>
      <h2 className="text-xl font-bold">What we store</h2><p>Your email, optional profile details, and the check-ins, goals, journal entries and bookmarks you create. Row-level security restricts each of these to your account.</p>
      <h2 className="text-xl font-bold">What is public</h2><p>Only posts and replies you choose to publish in the community, shown with your display name to signed-in members. Journal and check-in data never appear there.</p>
      <h2 className="text-xl font-bold">Your controls</h2><p>Edit or delete your content, export your data as JSON, or delete your account from Settings.</p>
      <h2 className="text-xl font-bold">Third-party links</h2><p>Videos and communities open on external sites we do not control.</p>
      <h2 className="text-xl font-bold">Not medical care</h2><p>Beyond Addiction does not diagnose or treat any condition and is not a substitute for professional care.</p>
    </div>
  )
}
