import { useState, useLayoutEffect } from 'react'

function useResizeObserver(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return size
}

export default useResizeObserver
