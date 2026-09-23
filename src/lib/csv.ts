/** Minimal RFC 4180 CSV writer plus a browser download helper. */

type Cell = string | number | boolean | null | undefined

export function escapeCsvCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  // Quote when the value contains a delimiter, quote or newline; double inner quotes.
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: Record<string, Cell>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(','))
  }
  // BOM so Excel opens UTF-8 accents correctly.
  return `﻿${lines.join('\r\n')}`
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
