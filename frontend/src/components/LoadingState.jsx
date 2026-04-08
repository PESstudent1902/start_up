import React, { useState, useEffect } from 'react'

const messages = [
  "Finding the right project for you...",
  "Checking what the industry needs right now...",
  "Analyzing market trends...",
  "Crafting your personalized roadmap...",
  "Consulting industry mentors...",
  "Preparing your build guide...",
]

const LoadingState = ({ message }) => {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % messages.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [message])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
      </div>
      <div className="text-center">
        <p className="text-blue-400 font-medium text-lg animate-pulse">
          {message || messages[msgIndex]}
        </p>
        <p className="text-slate-500 text-sm mt-1">AI is working for you...</p>
      </div>
    </div>
  )
}

export default LoadingState
