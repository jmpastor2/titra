import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Full-height sheet for long forms. */
  tall?: boolean
}

interface Viewport {
  height: number
  top: number
  /** The on-screen keyboard is covering part of the layout viewport. */
  keyboard: boolean
}

/**
 * The part of the screen that is really visible. On iOS the layout viewport does not shrink
 * when the keyboard opens, so a sheet sized to it ends up half behind the keyboard with its
 * footer floating over the fields; following the visual viewport keeps it above the keyboard.
 */
function useVisualViewport(active: boolean): Viewport | null {
  const [vp, setVp] = useState<Viewport | null>(null)
  useEffect(() => {
    const v = typeof window === 'undefined' ? undefined : window.visualViewport
    if (!active || !v) return
    const read = () =>
      setVp({
        height: Math.round(v.height),
        top: Math.round(v.offsetTop),
        keyboard: window.innerHeight - v.height > 120,
      })
    read()
    v.addEventListener('resize', read)
    v.addEventListener('scroll', read)
    return () => {
      v.removeEventListener('resize', read)
      v.removeEventListener('scroll', read)
      setVp(null)
    }
  }, [active])
  return vp
}

/**
 * iOS-style bottom sheet. Uses a native <dialog> for focus trapping and Escape
 * handling, portalled to body so it escapes any transformed ancestor.
 */
export function Sheet({ open, onClose, title, description, children, footer, tall }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useTranslation()
  const vp = useVisualViewport(open)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      // showModal() focuses the first control (the close button). Prefer the field the
      // sheet marks with data-autofocus, else the panel itself, so no stray focus ring.
      const target =
        el.querySelector<HTMLElement>('[data-autofocus]') ??
        el.querySelector<HTMLElement>('[role="document"]')
      target?.focus({ preventScroll: true })
    }
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Click on backdrop (outside the panel) closes.
        if (e.target === ref.current) onClose()
      }}
      className={clsx(
        'm-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/60 backdrop:backdrop-blur-[3px]',
        'fixed inset-0 h-full w-full',
      )}
    >
      {open && (
        <div
          className="absolute inset-x-0 top-0 flex h-full w-full items-end justify-center sm:items-center"
          style={vp ? { height: vp.height, top: vp.top } : undefined}
        >
          <div
            role="document"
            tabIndex={-1}
            className={clsx(
              'outline-none',
              'sheet-in flex w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-line-strong bg-panel shadow-2xl sm:rounded-[28px]',
              vp?.keyboard ? 'h-full' : tall ? 'h-[92dvh]' : 'max-h-[92dvh]',
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
            <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
              <div className="min-w-0">
                {title && (
                  <h2 className="break-words text-[19px] font-semibold leading-snug">{title}</h2>
                )}
                {description && (
                  <p className="mt-0.5 break-words text-[13px] text-muted">{description}</p>
                )}
              </div>
              {/* A 44 px target that takes the room of the 36 px it looks like. */}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="-mr-2.5 -my-1 grid size-11 shrink-0 place-items-center rounded-full text-muted outline-none hover:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60 active:bg-panel-2"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
            {footer && (
              <footer
                className={clsx(
                  'border-t border-line bg-panel px-5 pt-3',
                  vp?.keyboard ? 'pb-3' : 'safe-bottom',
                )}
              >
                {footer}
              </footer>
            )}
          </div>
        </div>
      )}
    </dialog>,
    document.body,
  )
}
