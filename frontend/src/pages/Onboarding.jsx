import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const TRACKS = [
  { id: 'Web Development', icon: '🌐', desc: 'HTML, CSS, JS, React, Node.js' },
  { id: 'Python / Data Science', icon: '🐍', desc: 'Python, Pandas, ML basics' },
  { id: 'Core Computer Science', icon: '💻', desc: 'OS, DBMS, Networking, Algorithms' },
  { id: 'Mechanical / Civil Engineering', icon: '⚙️', desc: 'Design, Analysis, Optimization' },
  { id: 'Commerce / Finance', icon: '📊', desc: 'Financial modeling, Economics' },
  { id: 'Biology / Life Sciences', icon: '🔬', desc: 'Research, Lab protocols, Data analysis' },
]

const STREAMS = ['Engineering', 'Commerce', 'Science', 'Arts', 'Management', 'Other']
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Graduate']

const Onboarding = ({ onUserCreated }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    college: '',
    stream: '',
    year: '',
    track: '',
    difficulty: '',
  })

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.college || !form.stream || !form.year || !form.track || !form.difficulty) {
      toast.error('Please complete all fields')
      return
    }

    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      const response = await axios.post(`${apiUrl}/api/users/`, form)
      const userData = {
        ...response.data.user,
        difficulty: form.difficulty,
      }
      onUserCreated(userData)
      toast.success('Welcome to BuildIQ! 🚀')
    } catch (error) {
      console.error('Error creating user:', error)
      // Allow offline/demo mode
      const mockUser = {
        id: `demo_${Date.now()}`,
        ...form,
        created_at: new Date().toISOString(),
      }
      onUserCreated(mockUser)
      toast.success('Welcome to BuildIQ! 🚀 (Demo mode)')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold gradient-text mb-3">BuildIQ</h1>
          <p className="text-slate-400 text-lg">Build Real Projects. Learn Fast. Get Hired.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-blue-500 w-12' : 'bg-slate-700 w-6'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white mb-6">👋 Let's get to know you</h2>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-navy-700 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">College Name</label>
                <input
                  type="text"
                  value={form.college}
                  onChange={e => updateForm('college', e.target.value)}
                  placeholder="IIT Delhi / VIT Vellore / etc."
                  className="w-full bg-navy-700 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Stream</label>
                  <select
                    value={form.stream}
                    onChange={e => updateForm('stream', e.target.value)}
                    className="w-full bg-navy-700 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select stream</option>
                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Year</label>
                  <select
                    value={form.year}
                    onChange={e => updateForm('year', e.target.value)}
                    className="w-full bg-navy-700 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={() => form.name && form.college && form.stream && form.year ? setStep(2) : toast.error('Fill all fields')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">🎯 Choose your track</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRACKS.map(track => (
                  <button
                    key={track.id}
                    onClick={() => updateForm('track', track.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.track === track.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-500 bg-navy-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">{track.icon}</div>
                    <div className="font-medium text-white text-sm">{track.id}</div>
                    <div className="text-xs text-slate-400 mt-1">{track.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-navy-700 hover:bg-navy-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => form.track ? setStep(3) : toast.error('Select a track')}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">⚡ Pick your difficulty</h2>
              <div className="space-y-3">
                {[
                  { level: 'Beginner', icon: '🌱', desc: 'New to this track. Learning fundamentals.', time: '5-10 hrs' },
                  { level: 'Intermediate', icon: '🔥', desc: 'Know the basics. Ready for real challenges.', time: '10-20 hrs' },
                  { level: 'Advanced', icon: '⚡', desc: 'Experienced. Want industry-level complexity.', time: '20-40 hrs' },
                ].map(d => (
                  <button
                    key={d.level}
                    onClick={() => updateForm('difficulty', d.level)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      form.difficulty === d.level
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-500 bg-navy-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{d.icon}</span>
                        <div>
                          <div className="font-semibold text-white">{d.level}</div>
                          <div className="text-xs text-slate-400">{d.desc}</div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-400">{d.time}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-navy-700 hover:bg-navy-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.difficulty}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-xl transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Setting up...
                    </>
                  ) : (
                    '🚀 Start Building'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Join 10,000+ Indian students building industry projects
        </p>
      </div>
    </div>
  )
}

export default Onboarding
