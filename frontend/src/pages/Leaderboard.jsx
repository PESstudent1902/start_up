import React, { useState, useEffect } from 'react'
import axios from 'axios'

const TRACKS = ['all', 'Web Development', 'Python / Data Science', 'Core Computer Science', 'Mechanical / Civil Engineering', 'Commerce / Finance', 'Biology / Life Sciences']
const PERIODS = [
  { id: 'all_time', label: 'All Time' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_week', label: 'This Week' },
]

const Leaderboard = ({ user }) => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [track, setTrack] = useState('all')
  const [period, setPeriod] = useState('all_time')

  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${apiUrl}/api/leaderboard/?track=${encodeURIComponent(track)}&period=${period}`)
        setEntries(response.data.leaderboard || [])
      } catch (error) {
        console.error('Leaderboard fetch error:', error)
        setEntries([])
      }
      setLoading(false)
    }

    fetchLeaderboard()
  }, [track, period])

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
    if (rank === 2) return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    if (rank === 3) return 'bg-amber-700/10 border-amber-700/30 text-amber-600'
    return 'bg-navy-700 border-slate-700/50 text-slate-600'
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="min-h-screen bg-navy-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
          <p className="text-slate-400 mt-1">Top builders in the community</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1.5">Track</label>
            <select
              value={track}
              onChange={e => setTrack(e.target.value)}
              className="w-full bg-navy-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {TRACKS.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Tracks' : t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Period</label>
            <div className="flex gap-2">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    period === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-navy-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-navy-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold text-white mb-2">No rankings yet</h3>
            <p className="text-slate-400">Be the first to submit a project and claim the top spot!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${getRankStyle(entry.rank)} transition-all`}
              >
                <div className="w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  {entry.name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{entry.name}</p>
                    {entry.name === user.name && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{entry.college}</p>
                </div>

                <div className="hidden sm:block flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{entry.project_title}</p>
                  <p className="text-xs text-slate-500">{entry.track}</p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-white'}`}>
                    {entry.score}
                  </div>
                  <div className="text-xs text-slate-500">points</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">Complete a project and submit your GitHub link to join the leaderboard.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
