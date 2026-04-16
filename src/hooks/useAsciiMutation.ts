import { useEffect, useMemo, useState } from 'react'

const symbolPool = ['#', '@', '$', '%', '&', '/', '\\', '|', ':', ';', '+', '=', '*', 'S', 'A', 'W', 'Y'] as const

function mutateAscii(base: string) {
  return [...base]
    .map((character) => {
      if (character === ' ' || character === '\n') return character
      if (Math.random() > 0.22) return character
      return symbolPool[Math.floor(Math.random() * symbolPool.length)]
    })
    .join('')
}

export function useAsciiMutation(base: string, intervalMs = 160) {
  const stableBase = useMemo(() => base, [base])
  const [frame, setFrame] = useState(stableBase)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFrame(mutateAscii(stableBase))
    }, intervalMs)

    return () => window.clearInterval(interval)
  }, [intervalMs, stableBase])

  return frame
}
