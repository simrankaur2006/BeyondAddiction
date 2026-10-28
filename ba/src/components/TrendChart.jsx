import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { fmtShort } from '../lib/utils'

/** rows: [{ date, mood, stress, craving, sleep }] — gaps stay gaps (connectNulls=false), nothing is interpolated. */
export default function TrendChart({ rows, series, height = 260 }) {
  return (
    <div style={{ height }} className="w-full"><ResponsiveContainer>
      <LineChart data={rows} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d5e9df" />
        <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} allowDecimals={false} />
        <Tooltip labelFormatter={fmtShort} /><Legend />
        {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />)}
      </LineChart>
    </ResponsiveContainer></div>
  )
}
export const SERIES = [
  { key: 'mood', name: 'Mood (1–5)', color: '#14968b' }, { key: 'stress', name: 'Stress (1–5)', color: '#c8692f' },
  { key: 'craving', name: 'Craving (0–10)', color: '#184c3d' }, { key: 'sleep', name: 'Sleep (1–5)', color: '#7a6bb0' },
]
