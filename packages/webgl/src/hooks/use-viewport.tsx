import { useEffect, useState } from 'react'

export const useViewportSize = ({
  unsafe = false
}: {
  unsafe?: boolean
} = {}) => {
  const [windowSize, setWindowSize] = useState<{
    width: number
    height: number
    ratio: number
  }>({
    width: unsafe ? window.innerWidth : 0,
    height: unsafe ? window.innerHeight : 0,
    ratio: unsafe ? window.innerWidth / window.innerHeight : 0
  })

  useEffect(() => {
    const onResize = () => {
      const result = {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.innerWidth / window.innerHeight
      }

      setWindowSize(result)
    }

    window.addEventListener('resize', onResize, { passive: true })

    /*
      If is unsafe don't need to run it again because
      its's the same value as the initial
    */
    if (!unsafe) {
      onResize()
    }

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [unsafe])

  return windowSize
}
