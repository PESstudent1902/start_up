import React, { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

const ARIA_AVATAR = '🎓'
const MAX_CONVERSATION_HISTORY = 8

// Strip markdown syntax so it sounds natural when spoken aloud
const stripMarkdown = (text) =>
  text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n+/g, ' ').trim()

const TutorChat = ({ project, currentStep }) => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey! I'm **Aria**, your BuildIQ tutor 🎓\n\nI'm here to help you build **${project?.title || 'your project'}**. Ask me anything — concepts, errors, "why does this work", anything at all!`,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)
  // Set to false after first 503 from backend so we stop trying ElevenLabs
  const useElevenLabsRef = useRef(true)

  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // ── Speech output ──────────────────────────────────────────────────────────

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  const speakWithBrowser = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    // Prefer a clear female English voice for the "teacher" feel
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find((v) => v.name === 'Google UK English Female') ||
      voices.find((v) => /female/i.test(v.name) && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null
    if (preferred) utterance.voice = preferred
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const speakText = useCallback(
    async (text) => {
      stopSpeaking()
      const clean = stripMarkdown(text)
      if (!clean) return

      if (useElevenLabsRef.current) {
        try {
          const response = await axios.post(
            `${apiUrl}/api/voice/speak`,
            { text: clean },
            { responseType: 'blob', timeout: 20000 }
          )
          const url = URL.createObjectURL(response.data)
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onplay = () => setIsSpeaking(true)
          audio.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(url)
            audioRef.current = null
          }
          audio.onerror = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(url)
            audioRef.current = null
            speakWithBrowser(clean)
          }
          try {
            await audio.play()
          } catch {
            // Autoplay blocked or playback error — fall back to browser TTS
            URL.revokeObjectURL(url)
            audioRef.current = null
            speakWithBrowser(clean)
          }
          return
        } catch (err) {
          // 503 means ElevenLabs key is not configured — stop trying it
          if (err.response?.status === 503) {
            useElevenLabsRef.current = false
          }
          // Fall through to browser TTS
        }
      }

      speakWithBrowser(clean)
    },
    [apiUrl, stopSpeaking, speakWithBrowser]
  )

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) stopSpeaking()
      return !prev
    })
  }, [stopSpeaking])

  // Stop speaking when the chat window is closed
  useEffect(() => {
    if (!open) stopSpeaking()
  }, [open, stopSpeaking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      recognitionRef.current?.stop()
    }
  }, [stopSpeaking])

  // ── Speech input ───────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || recognitionRef.current) return // unsupported or already running

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }
    recognition.onerror = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // ── Messaging ──────────────────────────────────────────────────────────────

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
        conversation_history: newMessages.slice(-MAX_CONVERSATION_HISTORY).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      })
      const answer = response.data.answer
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
      if (voiceEnabled) speakText(answer)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't connect right now. Check your internet and try again! 🙂",
        },
      ])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  // Render markdown-lite: bold **text**, line breaks
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

  const hasSpeechRecognition =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        title="Ask Aria, your AI tutor"
      >
        {open ? '✕' : ARIA_AVATAR}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
          style={{ height: '480px', background: '#0f172a' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-purple-700">
            <span className="text-2xl">{ARIA_AVATAR}</span>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-tight">Aria — BuildIQ Tutor</p>
              <p className="text-blue-200 text-xs">
                {isSpeaking ? 'Speaking…' : 'Always here to help you learn'}
              </p>
            </div>

            {/* Stop-speaking button — only visible while Aria is talking */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                title="Stop speaking"
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-base transition-colors"
              >
                ⏹
              </button>
            )}

            {/* Sound-wave animation when speaking */}
            {isSpeaking && (
              <div className="flex items-end gap-0.5 h-5" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-1 bg-white/80 rounded-full"
                    style={{
                      animation: 'soundWave 0.8s ease-in-out infinite alternate',
                      animationDelay: `${i * 0.15}s`,
                      height: `${40 + i * 15}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Voice on/off toggle */}
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? 'Mute Aria voice' : 'Enable Aria voice'}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors ${
                voiceEnabled
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              }`}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <span className="text-lg flex-shrink-0 mt-0.5">{ARIA_AVATAR}</span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <span className="text-lg">{ARIA_AVATAR}</span>
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="px-3 py-3 border-t border-slate-700 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Aria anything…"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              style={{ maxHeight: '80px' }}
            />

            {/* Microphone button */}
            {hasSpeechRecognition && (
              <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                title={isListening ? 'Listening… release to stop' : 'Hold to speak'}
                aria-label="Hold to speak"
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all ${
                  isListening
                    ? 'bg-red-500 ring-4 ring-red-400/60 animate-pulse'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                🎤
              </button>
            )}

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Sound-wave keyframe animation */}
      <style>{`
        @keyframes soundWave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </>
  )
}

export default TutorChat
