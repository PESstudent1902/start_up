import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Confetti from '../components/Confetti'
import TutorChat from '../components/TutorChat'

const ProjectPage = ({ user }) => {
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])
  const [expandedStep, setExpandedStep] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tutorStep, setTutorStep] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    const savedProject = localStorage.getItem('buildiq_current_project')
    const savedSteps = localStorage.getItem('buildiq_completed_steps')
    if (savedProject) {
      try {
        setProject(JSON.parse(savedProject))
      } catch (e) {}
    }
    if (savedSteps) {
      try {
        setCompletedSteps(JSON.parse(savedSteps))
      } catch (e) {}
    }
  }, [])

  const toggleStep = async (stepNumber) => {
    const isCompleted = completedSteps.includes(stepNumber)
    let newCompleted

    if (isCompleted) {
      newCompleted = completedSteps.filter(s => s !== stepNumber)
    } else {
      newCompleted = [...completedSteps, stepNumber]
      setShowConfetti(true)
      toast.success(`Step ${stepNumber} complete! 🎉`, { icon: '✅' })
    }

    setCompletedSteps(newCompleted)
    localStorage.setItem('buildiq_completed_steps', JSON.stringify(newCompleted))

    if (project?.project_id && !user.id?.startsWith('demo_')) {
      setSaving(true)
      try {
        await axios.put(`${apiUrl}/api/projects/${project.project_id}/steps`, {
          completed_steps: newCompleted,
        })
      } catch (e) {
        console.error('Save steps error:', e)
      }
      setSaving(false)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No project loaded.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const progress = project.steps
    ? Math.round((completedSteps.length / project.steps.length) * 100)
    : 0

  const isAllDone = project.steps && completedSteps.length === project.steps.length

  return (
    <div className="min-h-screen bg-navy-900 p-4 md:p-8">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{project.difficulty}</span>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">{project.estimated_hours}</span>
                {saving && <span className="text-xs text-slate-500">Saving...</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{project.title}</h1>
              <p className="text-slate-400">{project.problem_statement}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Build Progress</span>
              <span className="text-white font-bold">{progress}% ({completedSteps.length}/{project.steps?.length || 0} steps)</span>
            </div>
            <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isAllDone && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <p className="text-green-400 font-bold text-lg">🎉 Project Complete!</p>
              <p className="text-slate-400 text-sm mt-1">Submit your GitHub link to get your score</p>
              {project.project_id && (
                <button
                  onClick={() => navigate(`/submit/${project.project_id}`)}
                  className="mt-3 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                >
                  Submit for Review →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Industry Relevance */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">💼 Why This Matters</h2>
          <p className="text-slate-300">{project.industry_relevance}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-sm font-medium text-blue-400 mb-2">What You'll Learn</h3>
              <ul className="space-y-1">
                {project.what_you_will_learn?.map((item, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-400 mb-2">Tools Required</h3>
              <div className="flex flex-wrap gap-2">
                {project.tools_required?.map((tool, i) => (
                  <span key={i} className="text-xs bg-navy-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700">
                    {tool}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">📚 {project.college_subject_connection}</p>
            </div>
          </div>
        </div>

        {/* Build Steps */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold text-white">🗺️ Your Build Roadmap</h2>
          {project.steps?.map((step) => {
            const isDone = completedSteps.includes(step.step_number)
            const isExpanded = expandedStep === step.step_number

            return (
              <div
                key={step.step_number}
                className={`glass-card rounded-2xl overflow-hidden step-card transition-all ${
                  isDone ? 'border border-green-500/30' : 'border border-slate-700/50'
                }`}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStep(step.step_number)
                      }}
                      className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      {isDone && <span className="text-xs">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">Step {step.step_number}</span>
                        {isDone && <span className="text-xs text-green-400">Completed</span>}
                      </div>
                      <h3 className={`font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {step.title}
                      </h3>
                      {!isExpanded && (
                        <p className="text-slate-500 text-sm mt-1 line-clamp-1">{step.instruction}</p>
                      )}
                    </div>

                    <span className="text-slate-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-700/50 pt-4 space-y-4">
                    <div>
                      <p className="text-slate-300 text-sm leading-relaxed">{step.instruction}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-navy-700 rounded-xl p-4">
                        <h4 className="text-xs font-medium text-yellow-400 mb-2">💡 Why This Matters</h4>
                        <p className="text-slate-400 text-sm">{step.why_this_matters}</p>
                      </div>
                      <div className="bg-navy-700 rounded-xl p-4">
                        <h4 className="text-xs font-medium text-blue-400 mb-2">🏢 Industry Context</h4>
                        <p className="text-slate-400 text-sm">{step.industry_context}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setTutorStep(step)}
                      className="w-full py-2.5 rounded-xl font-medium text-sm transition-colors bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/30"
                    >
                      🎓 Ask Aria about this step
                    </button>

                    <button
                      onClick={() => toggleStep(step.step_number)}
                      className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${
                        isDone
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                          : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30'
                      }`}
                    >
                      {isDone ? '↩ Mark Incomplete' : '✓ Mark as Complete'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Interview Tips */}
        {project.interview_talking_points && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">🎤 Interview Talking Points</h2>
            <div className="space-y-2">
              {project.interview_talking_points.map((point, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-navy-700 rounded-xl">
                  <span className="text-blue-400 font-bold text-sm">{i + 1}.</span>
                  <p className="text-slate-300 text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TutorChat project={project} currentStep={tutorStep} />
    </div>
  )
}

export default ProjectPage
