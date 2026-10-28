import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Heart, MessageCircle, Flag, Pencil, Trash2, Plus, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { Field, Spinner, ErrorBox, Empty, PageHeader, Modal, Confirm, ExternalLink } from '../components/ui'
import { postSchema, commentSchema, reportSchema } from '../schemas'
import { COMMUNITY_CATEGORIES } from '../lib/constants'
import { DIRECTORY, DIRECTORY_CATEGORIES } from '../lib/directory'
import { listPosts, createPost, updatePost, deletePost, toggleReaction, listComments, addComment, deleteComment, reportPost } from '../services/api'
import { fmtTime, cx } from '../lib/utils'

function Directory() {
  const [cat, setCat] = useState('all'); const [q, setQ] = useState('')
  const list = DIRECTORY.filter((d) => (cat === 'all' || d.cats.includes(cat)) && (!q || (d.name + d.desc + d.audience).toLowerCase().includes(q.toLowerCase())))
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-neutral-400" /><input className="input !pl-9" placeholder="Search communities" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search directory" /></div>
        <select className="input sm:w-72" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Directory category"><option value="all">All categories</option>{DIRECTORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      {list.length === 0 ? <Empty title="No matches" /> : <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{list.map((d) => (
        <article key={d.url} className="card flex flex-col"><div className="flex flex-wrap gap-1.5">{d.cats.map((c) => <span key={c} className="chip">{c}</span>)}</div>
          <h3 className="mt-2 text-lg font-bold">{d.name}</h3><p className="text-xs text-neutral-500">{d.type} · {d.region}</p>
          <p className="mt-2 text-sm text-neutral-700">{d.desc}</p><p className="mt-2 text-sm"><strong>For:</strong> {d.audience}</p>
          <div className="mt-auto pt-3"><ExternalLink href={d.url} className="btn-primary">Visit community</ExternalLink></div></article>))}</div>}
      <p className="mt-5 rounded-lg bg-sand p-3 text-xs text-neutral-700">These are third-party sites. Beyond Addiction does not run or moderate them, and their privacy practices differ from ours. Peer groups and forums are not professional treatment. Never share more personal information than you are comfortable with.</p>
    </div>
  )
}

function PostForm({ post, onDone }) {
  const toast = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(postSchema), defaultValues: { title: post?.title || '', body: post?.body || '', category: post?.category || 'general' } })
  const submit = async (v) => { try { post ? await updatePost(post.id, v) : await createPost(v); toast.success(post ? 'Post updated' : 'Post published'); onDone(true) } catch (e) { toast.error(e.message) } }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <p className="rounded-lg bg-sand p-3 text-xs">Posts are visible to all signed-in members under your display name. Do not share contact details, medical records or anything you want kept private. Be kind; see the guidelines on the feed.</p>
      <Field label="Category"><select className="input" {...register('category')}>{COMMUNITY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Title" error={errors.title?.message}><input className="input" {...register('title')} /></Field>
      <Field label="Message" error={errors.body?.message}><textarea rows={6} className="input" {...register('body')} /></Field>
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => onDone(false)}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : post ? 'Save changes' : 'Publish'}</button></div>
    </form>
  )
}
function ReportForm({ post, onDone }) {
  const { user } = useAuth(); const toast = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(reportSchema) })
  return (<form onSubmit={handleSubmit(async (v) => { try { await reportPost(user.id, post.id, v.reason); toast.success('Report sent to moderators'); onDone() } catch (e) { toast.error(e.message); onDone() } })} className="space-y-4" noValidate>
    <p className="text-sm">Reporting "{post.title}". A moderator will review it.</p>
    <Field label="What is the problem?" error={errors.reason?.message}><textarea rows={3} className="input" {...register('reason')} /></Field>
    <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onDone}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>Send report</button></div></form>)
}
function PostDetail({ post, onClose, onChanged }) {
  const { user, isAdmin } = useAuth(); const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listComments(post.id), [post.id])
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(commentSchema) })
  return (
    <Modal wide title={post.title} onClose={onClose}>
      <p className="text-xs text-neutral-500">{post.author_name} · {post.category} · {fmtTime(post.created_at)}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm">{post.body}</p>
      <h3 className="mb-2 mt-6 text-base font-bold">Replies</h3>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.length === 0 ? <p className="text-sm text-neutral-600">No replies yet. Be the first to offer support.</p> : (
        <ul className="space-y-3">{data.map((c) => (<li key={c.id} className="rounded-lg bg-white p-3 text-sm"><p className="text-xs text-neutral-500">{c.author_name} · {fmtTime(c.created_at)}</p><p className="mt-1 whitespace-pre-wrap">{c.body}</p>
          {(c.user_id === user.id || isAdmin) && <button className="mt-1 text-xs text-red-700 underline" onClick={async () => { try { await deleteComment(c.id); reload(); onChanged() } catch (e) { toast.error(e.message) } }}>Delete reply</button>}</li>))}</ul>)}
      <form className="mt-4 space-y-2" noValidate onSubmit={handleSubmit(async (v) => { try { await addComment(post.id, v.body); reset(); reload(); onChanged() } catch (e) { toast.error(e.message) } })}>
        <Field label="Reply" error={errors.body?.message}><textarea rows={3} className="input" {...register('body')} /></Field><button className="btn-primary" disabled={isSubmitting}>Post reply</button></form>
    </Modal>
  )
}

function Feed() {
  const { user } = useAuth(); const toast = useToast()
  const [cat, setCat] = useState('all'); const [posts, setPosts] = useState([]); const [page, setPage] = useState(0)
  const [more, setMore] = useState(false); const [loading, setLoading] = useState(true); const [err, setErr] = useState('')
  const [modal, setModal] = useState(null)
  const load = useCallback(async (p, reset) => {
    setLoading(true); setErr('')
    try { const r = await listPosts({ category: cat, page: p }); setPosts((s) => (reset ? r.posts : [...s, ...r.posts])); setMore(r.hasMore); setPage(p) } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }, [cat])
  useEffect(() => { load(0, true) }, [load])
  const react = async (p) => {
    const on = p.reactions.some((r) => r.user_id === user.id)
    try { await toggleReaction(user.id, p.id, on); setPosts((s) => s.map((x) => x.id === p.id ? { ...x, reactions: on ? x.reactions.filter((r) => r.user_id !== user.id) : [...x.reactions, { post_id: p.id, user_id: user.id }] } : x)) } catch (e) { toast.error(e.message) }
  }
  return (
    <div>
      <details className="mb-4 rounded-xl border border-forest-100 bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Community guidelines</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700"><li>Be respectful. No shaming, harassment or judgement of anyone's journey.</li><li>No sharing of personal contact details, or of where to obtain substances.</li><li>This is peer support, not medical advice. For emergencies see Help and Support.</li><li>Report anything that breaks these rules; moderators review every report.</li></ul></details>
      <div className="mb-4 flex flex-wrap items-center gap-2">{['all', ...COMMUNITY_CATEGORIES].map((c) => <button key={c} onClick={() => setCat(c)} className={cx('rounded-full border px-3 py-1 text-sm capitalize', cat === c ? 'border-forest-600 bg-forest-600 text-white' : 'border-neutral-300 bg-white')}>{c}</button>)}
        <button className="btn-primary ml-auto" onClick={() => setModal({ type: 'edit' })}><Plus size={16} />New post</button></div>
      {err && <ErrorBox message={err} onRetry={() => load(0, true)} />}
      {!err && !loading && posts.length === 0 && <Empty title="No posts yet" action={<button className="btn-primary" onClick={() => setModal({ type: 'edit' })}>Start the conversation</button>}>This space is new. Posting is optional; share only what you are comfortable with.</Empty>}
      <div className="grid gap-4 lg:grid-cols-2">{posts.map((p) => { const mine = p.user_id === user.id; const liked = p.reactions.some((r) => r.user_id === user.id); return (
        <article key={p.id} className="card"><div className="flex items-start justify-between gap-2"><div><span className="chip capitalize">{p.category}</span><h3 className="mt-1 text-lg font-bold"><button className="text-left hover:underline" onClick={() => setModal({ type: 'view', post: p })}>{p.title}</button></h3><p className="text-xs text-neutral-500">{p.author_name} · {fmtTime(p.created_at)}{p.updated_at !== p.created_at && ' · edited'}</p></div>
          {mine && <div className="flex"><button className="rounded p-2 hover:bg-sand" aria-label="Edit post" onClick={() => setModal({ type: 'edit', post: p })}><Pencil size={16} /></button><button className="rounded p-2 hover:bg-red-50" aria-label="Delete post" onClick={() => setModal({ type: 'del', post: p })}><Trash2 size={16} className="text-red-700" /></button></div>}</div>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm">{p.body}</p>
          <div className="mt-3 flex items-center gap-2 text-sm"><button className="btn-ghost !py-1" aria-pressed={liked} onClick={() => react(p)}><Heart size={14} className={liked ? 'fill-clay text-clay' : ''} />{p.reactions.length} support</button><button className="btn-ghost !py-1" onClick={() => setModal({ type: 'view', post: p })}><MessageCircle size={14} />{p.commentCount}</button>{!mine && <button className="btn-ghost ml-auto !py-1" onClick={() => setModal({ type: 'report', post: p })}><Flag size={14} />Report</button>}</div></article>) })}</div>
      {loading && <Spinner />}
      {more && !loading && <div className="mt-4 text-center"><button className="btn-ghost" onClick={() => load(page + 1, false)}>Load more</button></div>}
      {modal?.type === 'edit' && <Modal title={modal.post ? 'Edit post' : 'New post'} onClose={() => setModal(null)}><PostForm post={modal.post} onDone={(ch) => { setModal(null); if (ch) load(0, true) }} /></Modal>}
      {modal?.type === 'view' && <PostDetail post={modal.post} onClose={() => setModal(null)} onChanged={() => load(0, true)} />}
      {modal?.type === 'report' && <Modal title="Report post" onClose={() => setModal(null)}><ReportForm post={modal.post} onDone={() => setModal(null)} /></Modal>}
      {modal?.type === 'del' && <Confirm title="Delete your post?" message="The post and its replies will be permanently removed." onCancel={() => setModal(null)} onConfirm={async () => { try { await deletePost(modal.post.id); toast.success('Post deleted'); setModal(null); load(0, true) } catch (e) { toast.error(e.message) } }} />}
    </div>
  )
}

export default function Community() {
  const [tab, setTab] = useState('feed')
  return (
    <div className="w-full">
      <PageHeader title="Community" subtitle="Optional peer support. Browse trusted external communities, or use the moderated in-app feed." />
      <div className="mb-5 flex gap-2" role="tablist">{[['feed', 'Community feed'], ['dir', 'External directory']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-sm font-semibold', tab === k ? 'bg-forest-700 text-white' : 'bg-white border border-forest-100')}>{l}</button>)}</div>
      {tab === 'feed' ? <Feed /> : <Directory />}
    </div>
  )
}
