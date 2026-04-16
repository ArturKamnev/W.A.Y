import { useEffect, useState } from 'react'

export function useTypedRotatingText(messages: readonly string[], intervalMs = 5000, typeMs = 34) {
  const [{ messageIndex, visibleCount }, setTypingState] = useState({ messageIndex: 0, visibleCount: 0 })
  const currentMessage = messages[messageIndex] ?? ''

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setTypingState((state) => ({
        messageIndex: (state.messageIndex + 1) % messages.length,
        visibleCount: 0,
      }))
    }, intervalMs)

    return () => window.clearInterval(rotation)
  }, [intervalMs, messages.length])

  useEffect(() => {
    const typing = window.setInterval(() => {
      setTypingState((state) => {
        if (state.visibleCount >= currentMessage.length) {
          window.clearInterval(typing)
          return state
        }

        return { ...state, visibleCount: state.visibleCount + 1 }
      })
    }, typeMs)

    return () => window.clearInterval(typing)
  }, [currentMessage, typeMs])

  return currentMessage.slice(0, visibleCount)
}
