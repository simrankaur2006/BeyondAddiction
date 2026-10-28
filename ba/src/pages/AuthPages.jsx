import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { Field, ErrorBox } from '../components/ui'
import { signUpSchema, signInSchema, forgotSchema, resetSchema } from '../schemas'

const Shell = ({ title, sub, children }) => (
  <div className="mx-auto w-full max-w-md"><div className="card"><h1 className="text-2xl font-bold">{title}</h1><p className="mb-5 mt-1 text-sm text-neutral-600">{sub}</p>{children}</div></div>
)
const friendly = (m) => (/Invalid login/i.test(m) ? 'Email or password is incorrect. If you just signed up, confirm your email first.' : /rate limit/i.test(m) ? 'Too many attempts. Wait a few minutes and try again.' : m)

export function Login() {
  const nav = useNavigate(); const loc = useLocation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(signInSchema) })
  const [err, setErr] = useState('')
  const submit = async (v) => {
    setErr('')
    const { error } = await supabase.auth.signInWithPassword(v)
    if (error) return setErr(friendly(error.message))
    nav(loc.state?.from || '/app', { replace: true })
  }
  return (
    <Shell title="Welcome back" sub="Sign in to continue.">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {err && <ErrorBox message={err} />}
        <Field label="Email" error={errors.email?.message}><input className="input" type="email" autoComplete="email" {...register('email')} /></Field>
        <Field label="Password" error={errors.password?.message}><input className="input" type="password" autoComplete="current-password" {...register('password')} /></Field>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-4 text-sm"><Link className="link" to="/forgot-password">Forgot password?</Link> · <Link className="link" to="/signup">Create account</Link></p>
    </Shell>
  )
}
export function Signup() {
  const nav = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(signUpSchema) })
  const [err, setErr] = useState(''); const [sent, setSent] = useState('')
  const submit = async (v) => {
    setErr('')
    const { data, error } = await supabase.auth.signUp({ email: v.email, password: v.password, options: { data: { display_name: v.display_name || '' }, emailRedirectTo: `${window.location.origin}/login` } })
    if (error) return setErr(friendly(error.message))
    if (data.session) return nav('/onboarding', { replace: true })
    setSent(v.email)
  }
  if (sent) return <Shell title="Check your email" sub={`We sent a confirmation link to ${sent}. Open it, then sign in.`}><Link className="btn-primary" to="/login">Go to sign in</Link></Shell>
  return (
    <Shell title="Create your account" sub="Only an email and password are needed. A display name is optional.">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {err && <ErrorBox message={err} />}
        <Field label="Display name (optional)" hint="Shown with community posts if you ever post. Use a nickname." error={errors.display_name?.message}><input className="input" maxLength={40} {...register('display_name')} /></Field>
        <Field label="Email" error={errors.email?.message}><input className="input" type="email" autoComplete="email" {...register('email')} /></Field>
        <Field label="Password" hint="8+ characters with a letter and a number" error={errors.password?.message}><input className="input" type="password" autoComplete="new-password" {...register('password')} /></Field>
        <Field label="Confirm password" error={errors.confirm?.message}><input className="input" type="password" autoComplete="new-password" {...register('confirm')} /></Field>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link className="link" to="/login">Sign in</Link></p>
    </Shell>
  )
}
export function Forgot() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) })
  const [err, setErr] = useState(''); const [done, setDone] = useState(false)
  const submit = async (v) => {
    setErr('')
    const { error } = await supabase.auth.resetPasswordForEmail(v.email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) return setErr(friendly(error.message))
    setDone(true)
  }
  if (done) return <Shell title="Check your email" sub="If an account exists for that address, a reset link is on its way."><Link className="link" to="/login">Back to sign in</Link></Shell>
  return (
    <Shell title="Reset your password" sub="We will email you a reset link.">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {err && <ErrorBox message={err} />}
        <Field label="Email" error={errors.email?.message}><input className="input" type="email" {...register('email')} /></Field>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </Shell>
  )
}
export function Reset() {
  const nav = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) })
  const [err, setErr] = useState(''); const [ready, setReady] = useState(null)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === 'PASSWORD_RECOVERY') setReady(true) })
    supabase.auth.getSession().then(({ data }) => setReady((r) => r ?? !!data.session))
    return () => sub.subscription.unsubscribe()
  }, [])
  const submit = async (v) => {
    setErr('')
    const { error } = await supabase.auth.updateUser({ password: v.password })
    if (error) return setErr(friendly(error.message))
    nav('/app', { replace: true })
  }
  if (ready === false) return <Shell title="Link expired" sub="Open the most recent reset link from your email, or request a new one."><Link className="link" to="/forgot-password">Request a new link</Link></Shell>
  return (
    <Shell title="Choose a new password" sub="Then you will be signed in.">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {err && <ErrorBox message={err} />}
        <Field label="New password" error={errors.password?.message}><input className="input" type="password" autoComplete="new-password" {...register('password')} /></Field>
        <Field label="Confirm password" error={errors.confirm?.message}><input className="input" type="password" autoComplete="new-password" {...register('confirm')} /></Field>
        <button className="btn-primary w-full" disabled={isSubmitting || ready === null}>{isSubmitting ? 'Saving…' : 'Update password'}</button>
      </form>
    </Shell>
  )
}
