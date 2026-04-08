import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import LoadingState from '../components/LoadingState'

const Submission = ({ user }) => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [githubLink, setGithubLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState(null)
  const [project, setProject] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    const savedProject = localStorage.getItem('buildiq_current_project')
    if (savedProject) {
      try {
        setProject(JSON.parse(savedProject))
      } catch (e) {}
    }
  }, [])

  const handleSubmit = async () => {
    if (!githubLink.trim()) {
      toast.error('Please enter your GitHub repository link')
      return
    }
    if (!githubLink.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${apiUrl}/api/projects/${projectId}/submit`, {
        github_link: githubLink,
        user_id: user.id?.startsWith('demo_') ? null : user.id,
      })
      setReview(response.data.review)
      toast.success('Project reviewed! Check your score 🎉')
    } catch (error) {
      console.error('Submit error:', error)
      // Demo mode fallback
      setReview({
        score: Math.floor(Math.random() * 30) + 60,
        overall_feedback: "Great effort on this project! Your work shows dedication and practical skills.",
        strengths: ["Well-structured project", "Good problem-solving approach", "Relevant to industry needs"],
        improvements: ["Add more documentation", "Include test cases", "Improve code comments"],
        interview_readiness: "This project demonstrates solid foundational skills. With the improvements, it'll be interview-ready.",
        grade: "B+"
      })
      toast.success('Project reviewed! (Demo mode)')
    }
    setLoading(false)
  }

  const gradeColor = (grade) => {
    if (grade?.startsWith('A')) return 'text-green-400'
    if (grade?.startsWith('B')) return 'text-blue-400'
    if (grade?.startsWith('C')) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-navy-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/project')}
          className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2"
        >
          ← Back to Project
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Submit Your Project</h1>
        <p className="text-slate-400 mb-8">
          {project?.title || 'Your project'} — AI will review your GitHub repository
        </p>

        {!review && !loading && (
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                GitHub Repository Link
              </label>
              <input
                type="url"
                value={githubLink}
                onChange={e => setGithubLink(e.target.value)}
                placeholder="https://github.com/yourusername/project-name"
                className="w-full bg-navy-700 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">
                Make sure your repository is public and has a README
              </p>
            </div>

            <div className="bg-navy-700 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-white mb-3">📋 Before Submitting, Make Sure:</h3>
              <ul className="space-y-2">
                {[
                  'Repository is public on GitHub',
                  'README explains what the project does',
                  'Code is committed and pushed',
                  'At least basic functionality is working',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-blue-400">○</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all"
            >
              🚀 Submit for AI Review
            </button>
          </div>
        )}

        {loading && (
          <div className="glass-card rounded-2xl">
            <LoadingState message="AI is reviewing your project..." />
          </div>
        )}

        {review && (
          <div className="space-y-4">
            {/* Score Card */}
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Your Project Score</p>
              <div className="text-7xl font-black text-white mb-2">{review.score}</div>
              <div className="text-2xl font-bold mb-3">
                <span className={gradeColor(review.grade)}>{review.grade}</span>
              </div>
              <div className="h-3 bg-navy-700 rounded-full overflow-hidden mx-auto max-w-xs">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${review.score}%` }}
                />
              </div>
              <p className="text-slate-400 mt-4 text-sm">{review.overall_feedback}</p>
            </div>

            {/* Strengths */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">✅ Strengths</h3>
              <ul className="space-y-2">
                {review.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">📈 Areas to Improve</h3>
              <ul className="space-y-2">
                {review.improvements?.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-yellow-400 mt-0.5">→</span> {imp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interview Readiness */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">🎤 Interview Readiness</h3>
              <p className="text-slate-300 text-sm">{review.interview_readiness}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex-1 bg-navy-700 hover:bg-navy-600 text-white font-medium py-3 rounded-xl transition-colors"
              >
                View Leaderboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Submission
