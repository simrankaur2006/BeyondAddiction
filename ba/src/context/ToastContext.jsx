import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const Ctx = createContext(null)
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setItems((s) => [...s, { id, message, type }])
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={{ success: (m) => push(m, 'ok'), error: (m) => push(m, 'err') }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.type === 'ok' ? 'bg-forest-700' : 'bg-red-700'}`}>
            {t.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
