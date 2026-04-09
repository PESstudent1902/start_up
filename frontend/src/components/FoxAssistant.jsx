import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const MAX_CONVERSATION_HISTORY = 8

// ─── Fox SVG ─────────────────────────────────────────────────────────────────
const FoxSVG = ({ state }) => (
  <svg viewBox="0 0 100 110" width="90" height="99" className="drop-shadow-lg">
    {/* Tail */}
    <ellipse
      cx="75" cy="82" rx="18" ry="10"
      fill="#E8773A"
      transform="rotate(-25 75 82)"
    />
    <ellipse
      cx="84" cy="74" rx="8" ry="5"
      fill="white"
      transform="rotate(-25 84 74)"
    />
    {/* Body */}
    <ellipse cx="45" cy="74" rx="24" ry="20" fill="#E8773A" />
    {/* Belly */}
    <ellipse cx="45" cy="76" rx="14" ry="13" fill="#FFE4CC" />
    {/* Left leg */}
    <rect x="30" y="88" width="8" height="14" rx="4" fill="#C85F28" />
    {/* Right leg */}
    <rect x="50" y="88" width="8" height="14" rx="4" fill="#C85F28" />
    {/* Neck */}
    <rect x="38" y="55" width="14" height="14" fill="#E8773A" />
    {/* Head */}
    <ellipse cx="45" cy="44" rx="22" ry="20" fill="#E8773A" />
    {/* Left ear */}
    <polygon points="26,32 18,10 36,24" fill="#E8773A" />
    <polygon points="28,30 22,14 34,24" fill="#FFB6A0" />
    {/* Right ear */}
    <polygon points="64,32 72,10 54,24" fill="#E8773A" />
    <polygon points="62,30 68,14 56,24" fill="#FFB6A0" />
    {/* Face — white muzzle */}
    <ellipse cx="45" cy="50" rx="13" ry="10" fill="#FFE4CC" />
    {/* Eyes */}
    <circle cx="37" cy="40" r="4" fill="#1A0A00" />
    <circle cx="53" cy="40" r="4" fill="#1A0A00" />
    <circle cx="38" cy="39" r="1.5" fill="white" />
    <circle cx="54" cy="39" r="1.5" fill="white" />
    {/* Nose */}
    <ellipse cx="45" cy="49" rx="3" ry="2" fill="#1A0A00" />
    {/* Mouth */}
    <path d="M 42 52 Q 45 55 48 52" stroke="#1A0A00" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Arms */}
    {state === 'pointing' ? (
      /* Pointing arm stretched out to the left */
      <>
        <line x1="23" y1="68" x2="5" y2="58" stroke="#C85F28" strokeWidth="7" strokeLinecap="round" />
        <circle cx="5" cy="58" r="5" fill="#C85F28" />
      </>
    ) : (
      <>
        <ellipse cx="24" cy="72" rx="6" ry="4" fill="#C85F28" transform="rotate(-20 24 72)" />
        <ellipse cx="66" cy="72" rx="6" ry="4" fill="#C85F28" transform="rotate(20 66 72)" />
      </>
    )}
  </svg>
)

// ─── Speech Bubble ─────────────────────────────────────────────────────────
const SpeechBubble = ({ text, onClose }) => (
  <div className="absolute bottom-[106px] right-0 w-56 bg-white rounded-2xl shadow-xl p-3 text-sm text-gray-800 border border-orange-200"
    style={{ zIndex: 60 }}>
    <p className="leading-snug">{text}</p>
    <button
      onClick={onClose}
      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center hover:bg-orange-500"
    >✕</button>
    {/* Tail of bubble */}
    <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-orange-200 rotate-45" />
  </div>
)

// ─── Main TutorChat (chat panel) ────────────────────────────────────────────
const ChatPanel = ({ project, currentStep, onClose }) => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey! I'm **Aria**, your BuildIQ tutor 🎓\n\nI'm here to help you build **${project?.title || 'your project'}**. Ask me anything!`,
    },
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (currentStep) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        const hint = `I'm on **Step ${currentStep.step_number}: ${currentStep.title}** — can you help me?`
        if (last?.content === hint) return prev
        return [...prev, { role: 'user', content: hint }]
      })
      // Auto-ask about the step
      askAboutStep(currentStep)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const askAboutStep = async (step) => {
    if (!step) return
    setLoading(true)
    try {
      const response = await axios.post(`${apiUrl}/api/tutor/ask`, {
        question: `Can you explain step ${step.step_number}: "${step.title}"? The instruction is: ${step.instruction}`,
        project_title: project?.title || '',
        track: project?.track || '',
        step_title: step.title || '',
        step_instruction: step.instruction || '',
        conversation_history: [],
      })
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I couldn't connect right now. Check that the backend is running and try again! 🙂",
      }])
    }
    setLoading(false)
  }

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || loading) return

    const userMsg = { role: 'user', content: question }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/tutor/ask`, {
        question,
        project_title: project?.title || '',
        track: project?.track || '',
        step_title: currentStep?.title || '',
        step_instruction: currentStep?.instruction || '',
        conversation_history: newMessages.slice(-MAX_CONVERSATION_HISTORY).map(m => ({
          role: m.role,
          content: m.content,
        })),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Is the backend server running? 🙂",
      }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ))
    })
  }

  return (
    <div
      className="fixed bottom-28 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
      style={{ height: '480px', background: '#0f172a' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-500">
        <span className="text-2xl">🦊</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm leading-tight">Aria — BuildIQ Tutor</p>
          <p className="text-orange-100 text-xs">Your friendly AI fox guide</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && <span className="text-lg flex-shrink-0 mt-0.5">🦊</span>}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-orange-600 text-white rounded-tr-sm'
                : 'bg-slate-800 text-slate-200 rounded-tl-sm'
            }`}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <span className="text-lg">🦊</span>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-700 flex gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Aria anything…"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
          style={{ maxHeight: '80px' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
        >
          ↑
        </button>
      </div>
    </div>
  )
}

// ─── Fox Assistant (main export) ────────────────────────────────────────────
const BUBBLE_MESSAGES = {
  notStarted: "Hey! 👋 I noticed you haven't started yet. Let's kick off Step 1 together! Click me if you need help.",
  stalled: (stepNum) => `Looks like Step ${stepNum} might need some attention! I can help explain it — just click me! 🦊`,
  halfway: "You're more than halfway there! Keep going — you've got this! 💪",
  almostDone: "Almost done! Just a few more steps! 🔥",
  allDone: "🎉 You crushed it! All steps complete! Time to submit your project!",
}

const FoxAssistant = ({ project, currentStep, tutorTrigger = 0, completedSteps = [] }) => {
  const [chatOpen, setChatOpen] = useState(false)
  const [foxState, setFoxState] = useState('idle') // idle | alert | pointing | happy
  const [bubble, setBubble] = useState(null)
  const [foxPosition, setFoxPosition] = useState({ x: 0, y: 0 }) // offset from resting pos
  const [activeChatStep, setActiveChatStep] = useState(null)
  const bubbleTimeoutRef = useRef(null)

  const totalSteps = project?.steps?.length || 0
  const doneCount = completedSteps.length
  const progress = totalSteps > 0 ? doneCount / totalSteps : 0

  // Determine the first incomplete step
  const firstIncomplete = project?.steps?.find(s => !completedSteps.includes(s.step_number))

  // Show a bubble when the fox is alerted
  const showBubble = (msg, state = 'alert', pointLeft = false) => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    setBubble(msg)
    setFoxState(state)
    if (pointLeft) {
      setFoxPosition({ x: -30, y: -10 })
    }
    bubbleTimeoutRef.current = setTimeout(() => {
      setBubble(null)
      setFoxState('idle')
      setFoxPosition({ x: 0, y: 0 })
    }, 12000)
  }

  const dismissBubble = () => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    setBubble(null)
    setFoxState('idle')
    setFoxPosition({ x: 0, y: 0 })
  }

  // Periodic check — fox proactively comments on progress
  useEffect(() => {
    if (!project) return
    if (chatOpen) return

    const delay = 8000 // 8 s initial delay
    const interval = 45000 // re-check every 45 s

    const check = () => {
      if (chatOpen) return
      if (progress === 0 && totalSteps > 0) {
        showBubble(BUBBLE_MESSAGES.notStarted, 'pointing', true)
      } else if (progress === 1) {
        showBubble(BUBBLE_MESSAGES.allDone, 'happy')
      } else if (progress > 0 && progress < 1 && firstIncomplete) {
        showBubble(BUBBLE_MESSAGES.stalled(firstIncomplete.step_number), 'pointing', true)
      }
    }

    const initialTimer = setTimeout(check, delay)
    const intervalTimer = setInterval(check, interval)
    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, progress, chatOpen])

  // React when progress changes
  useEffect(() => {
    if (!project || totalSteps === 0) return
    if (progress === 1) {
      showBubble(BUBBLE_MESSAGES.allDone, 'happy')
    } else if (progress >= 0.5 && doneCount > 0) {
      showBubble(BUBBLE_MESSAGES.halfway, 'alert')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount])

  // Open chat from a specific step (called by ProjectPage)
  useEffect(() => {
    if (currentStep) {
      setActiveChatStep(currentStep)
      setChatOpen(true)
      dismissBubble()
    }
  }, [currentStep, tutorTrigger])

  const handleFoxClick = () => {
    dismissBubble()
    setActiveChatStep(null)
    setChatOpen(prev => !prev)
  }

  // Fox animation classes
  const foxAnimClass = foxState === 'idle'
    ? 'fox-idle'
    : foxState === 'happy'
      ? 'fox-happy'
      : foxState === 'pointing'
        ? 'fox-pointing'
        : 'fox-alert'

  return (
    <>
      {/* Inject keyframe animations */}
      <style>{`
        @keyframes foxBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes foxWiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes foxHappy {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(-10deg); }
          75% { transform: translateY(-12px) rotate(10deg); }
        }
        @keyframes foxPoint {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-8px); }
        }
        .fox-idle { animation: foxBob 3s ease-in-out infinite; }
        .fox-happy { animation: foxHappy 0.6s ease-in-out infinite; }
        .fox-pointing { animation: foxPoint 1s ease-in-out infinite; }
        .fox-alert { animation: foxWiggle 0.5s ease-in-out 3; }
      `}</style>

      {/* Chat panel */}
      {chatOpen && (
        <ChatPanel
          project={project}
          currentStep={activeChatStep}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Fox container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end"
        style={{ userSelect: 'none' }}
      >
        {/* Speech bubble */}
        {bubble && (
          <SpeechBubble text={bubble} onClose={dismissBubble} />
        )}

        {/* Fox character */}
        <div
          onClick={handleFoxClick}
          className={`cursor-pointer transition-all duration-500 ${foxAnimClass}`}
          style={{
            transform: `translate(${foxPosition.x}px, ${foxPosition.y}px)`,
            transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          title="Click to chat with Aria, your AI tutor"
        >
          <FoxSVG state={foxState === 'pointing' ? 'pointing' : 'normal'} />
        </div>

        {/* Label */}
        <p className="text-xs text-orange-300/70 mt-0.5 text-center pr-1">Aria 🦊</p>
      </div>
    </>
  )
}

export default FoxAssistant
