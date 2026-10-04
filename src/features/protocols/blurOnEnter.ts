import type { KeyboardEvent } from 'react'

/** "Hecho" on the phone keyboard: close it. */
export const blurOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') e.currentTarget.blur()
}
