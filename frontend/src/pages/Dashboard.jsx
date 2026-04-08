import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import LoadingState from '../components/LoadingState'

const Dashboard = ({ user }) => {
  const navigate = useNavigate()
  const [currentProject, setCurrentProject] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [badges, setBadges] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    const savedProject = localStorage.getItem('buildiq_current_project')
    if (savedProject) {
      try {
        setCurrentProject(JSON.parse(savedProject))
      } catch (e) {}
    }

    const fetchData = async () => {
      try {
        const [lbRes, badgesRes] = await Promise.allSettled([
          axios.get(`${apiUrl}/api/leaderboard/?track=${encodeURIComponent(user.track)}&period=all_time`),
          user.id && !user.id.startsWith('demo_')
            ? axios.get(`${apiUrl}/api/badges/user/${user.id}`)
            : Promise.resolve({ data: { badges: [] } })
        ])

        if (lbRes.status === 'fulfilled') {
          setLeaderboard(lbRes.value.data.leaderboard?.slice(0, 5) || [])
        }
        if (badgesRes.status === 'fulfilled') {
          setBadges(badgesRes.value.data.badges || [])
        }
      } catch (e) {
        console.error('Dashboard data fetch error:', e)
      }
      setLoading(false)
    }

    fetchData()
  }, [user])

  const generateProject = async () => {
    setGenerating(true)
    try {
      const response = await axios.post(`${apiUrl}/api/projects/generate`, {
        track: user.track,
        difficulty: user.difficulty || 'Beginner',
        stream: user.stream,
        college: user.college,
        user_id: user.id?.startsWith('demo_') ? null : user.id,
      })
      const project = response.data.project
      localStorage.setItem('buildiq_current_project', JSON.stringify(project))
      setCurrentProject(project)
      navigate('/project')
      toast.success('Project generated! Time to build 🚀')
    } catch (error) {
      console.error('Generate error:', error)
      toast.error('Failed to generate project. Check your API connection.')
    }
    setGenerating(false)
  }

  const completedSteps = currentProject
    ? (JSON.parse(localStorage.getItem('buildiq_completed_steps') || '[]')).length
    : 0
  const totalSteps = currentProject?.steps?.length || 0
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  if (generating) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Hey, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            {user.track} • {user.difficulty || 'Beginner'} • {user.college}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Project */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Current Project</h2>
              {currentProject ? (
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-2">{currentProject.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{currentProject.problem_statement}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                      {currentProject.difficulty}
                    </span>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                      {currentProject.estimated_hours}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{completedSteps} of {totalSteps} steps completed</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/project')}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors"
                    >
                      Continue Building →
                    </button>
                    {currentProject.project_id && (
                      <button
                        onClick={() => navigate(`/submit/${currentProject.project_id}`)}
                        className="px-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-medium py-2.5 rounded-xl transition-colors border border-green-600/30"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🏗️</div>
                  <p className="text-slate-400 mb-2">No project yet</p>
                  <p className="text-slate-500 text-sm mb-6">Let AI find the perfect project for you</p>
                </div>
              )}
            </div>

            {/* Generate New Button */}
            <button
              onClick={generateProject}
              disabled={generating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-lg">⚡ Generate New Project</span>
              <p className="text-xs text-white/70 mt-0.5">AI will find what's trending in {user.track}</p>
            </button>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Your Badges</h2>
                <div className="flex flex-wrap gap-3">
                  {badges.map(badge => (
                    <div key={badge.badge_name} className="flex items-center gap-2 bg-navy-700 px-3 py-2 rounded-xl">
                      <span className="text-xl">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{badge.name}</p>
                        <p className="text-xs text-slate-400">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Snapshot */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View all →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{user.track}</p>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-navy-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-navy-700'}`}>
                    <span className={`text-lg font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                      <p className="text-xs text-slate-500 truncate">{entry.college}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-400">{entry.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No rankings yet.</p>
                <p className="text-slate-600 text-xs mt-1">Be the first to build!</p>
              </div>
            )}

            <div className="mt-6 p-3 bg-navy-700 rounded-xl">
              <p className="text-xs text-slate-400 text-center">Complete projects to appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
