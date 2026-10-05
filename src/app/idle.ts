/**
 * Runs `task` once the browser is idle, so work that the first paint does not need stays off the
 * startup path. Safari has no requestIdleCallback: there it runs shortly after instead.
 * Returns a function that cancels the task if it has not started yet.
 */
export function whenIdle(
  task: () => void,
  { timeoutMs = 2000, fallbackMs = 250 } = {},
): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(task, { timeout: timeoutMs })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(task, fallbackMs)
  return () => window.clearTimeout(handle)
}
