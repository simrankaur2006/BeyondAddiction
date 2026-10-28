import { z } from 'zod'

const optText = (max) => z.string().max(max, `Keep this under ${max} characters`).optional().or(z.literal(''))
const optDate = z.string().optional().or(z.literal(''))
const cats = ['smoking', 'alcohol', 'substances', 'behavioral', 'other']

export const signUpSchema = z.object({
  display_name: z.string().max(40).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })
export const signInSchema = z.object({ email: z.string().email('Enter a valid email address'), password: z.string().min(1, 'Enter your password') })
export const forgotSchema = z.object({ email: z.string().email('Enter a valid email address') })
export const resetSchema = z.object({ password: z.string().min(8, 'Use at least 8 characters'), confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export const profileSchema = z.object({
  display_name: z.string().max(40, 'Keep this under 40 characters').optional().or(z.literal('')),
  recovery_goal: optText(200),
  habit_category: z.enum(cats).optional().or(z.literal('')),
  recovery_start_date: optDate,
  target_date: optDate,
})
export const goalSchema = z.object({
  title: z.string().min(1, 'Give your goal a name').max(120),
  description: optText(500),
  category: z.enum(cats),
  target_days: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(1, 'At least 1 day').max(3650),
  target_date: optDate,
})
const num = (min, max) => z.union([z.literal(''), z.coerce.number().min(min).max(max)]).optional()
export const checkInSchema = z.object({
  check_in_date: z.string().min(1),
  mood: num(1, 5), stress: num(1, 5), craving: num(0, 10), sleep: num(1, 5),
  notes: optText(1000), reflection: optText(1000),
})
export const journalSchema = z.object({
  title: z.string().min(1, 'Add a title').max(120),
  body: z.string().min(1, 'Write something first').max(10000),
  tags: optText(200),
})
export const postSchema = z.object({
  title: z.string().min(3, 'Title needs at least 3 characters').max(120),
  body: z.string().min(1, 'Write something first').max(3000),
  category: z.string().min(1),
})
export const commentSchema = z.object({ body: z.string().min(1, 'Write a reply').max(1500) })
export const reportSchema = z.object({ reason: z.string().min(3, 'Tell us briefly what is wrong').max(500) })
export const resourceSchema = z.object({
  title: z.string().min(3, 'Add a title'), category: z.string().min(1), publisher: z.string().min(2, 'Add a publisher'), description: z.string().min(10, 'Add a short description'),
  url: z.string().url('Enter a full URL').refine((u) => u.startsWith('https://'), 'Use an https:// link').refine((u) => !/youtube\.com\/results|google\.[a-z.]+\/search/.test(u), 'Use a direct link, not a search page'),
  kind: z.enum(['video', 'article']), tags: optText(200), language: optText(30), audience: optText(120),
})
