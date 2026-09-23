import { clsx } from 'clsx'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'info' | 'success' | 'warn' | 'error'
interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastApi {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const seq = useRef(0)

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = ++seq.current
    setItems((xs) => [...xs, { id, tone, message }])
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200)
  }, [])

  const api = useMemo(() => ({ toast }), [toast])

  const icons: Record<ToastTone, ReactNode> = {
    info: <Info className="size-4" />,
    success: <CheckCircle2 className="size-4" />,
    warn: <AlertTriangle className="size-4" />,
    error: <XCircle className="size-4" />,
  }
  const tones: Record<ToastTone, string> = {
    info: 'bg-ink text-canvas',
    success: 'bg-ok text-white',
    warn: 'bg-warn text-white',
    error: 'bg-danger text-white',
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={clsx(
              'fade-up pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium shadow-lg',
              tones[t.tone],
            )}
          >
            {icons[t.tone]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
