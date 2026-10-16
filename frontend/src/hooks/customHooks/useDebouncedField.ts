import { useEffect, useState } from 'react'

const DEFAULT_DELAY_MS = 300

export default function useDebouncedField(
  value: string,
  onCommit: (value: string) => void,
  delay = DEFAULT_DELAY_MS,
) {
  const [local, setLocal] = useState(value)
  const [seen, setSeen] = useState(value)
  const [committed, setCommitted] = useState(value)

  if (value !== seen) {
    setSeen(value)
    if (value !== committed) {
      setLocal(value)
      setCommitted(value)
    }
  }

  useEffect(() => {
    if (local === committed) {
      return
    }
    const timer = setTimeout(() => {
      setCommitted(local)
      onCommit(local)
    }, delay)
    return () => clearTimeout(timer)
  }, [local, committed, delay, onCommit])

  return [local, setLocal] as const
}
