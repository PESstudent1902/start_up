import React, { useState, useEffect } from 'react'
import ReactConfetti from 'react-confetti'

const Confetti = ({ show, onComplete }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!show) return null

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={200}
      onConfettiComplete={onComplete}
      colors={['#60a5fa', '#a78bfa', '#34d399', '#f59e0b', '#f472b6']}
    />
  )
}

export default Confetti
