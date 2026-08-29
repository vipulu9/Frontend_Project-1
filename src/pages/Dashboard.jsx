import { useEffect, useState } from 'react'
import api from '../services/api'

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [micState, setMicState] = useState('idle')

  useEffect(() => {
    let isMounted = true

    const fetchDashboard = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await api.get('/dashboard')

        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load dashboard data.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const features = data?.features ?? {}
  const transcript = [
    { speaker: 'VoicePilot', text: 'Good evening. I am online and ready to assist.' },
    { speaker: 'User', text: 'Play the stealth track.' },
    { speaker: 'VoicePilot', text: 'Opening the curated playlist for you.' },
    { speaker: 'User', text: 'Tell me the latest headlines.' },
    { speaker: 'VoicePilot', text: 'Fetching the top stories from the news feed.' }
  ]

  const toggleMicState = () => {
    setMicState((prev) => {
      if (prev === 'idle') return 'listening'
      if (prev === 'listening') return 'recording'
      return 'idle'
    })
  }

  const micStatusLabel = micState === 'idle' ? 'Standby mode' : micState === 'listening' ? 'Listening live' : 'Recording command'
  const micButtonClass =
    micState === 'recording' ? 'mic-button mic-button--recording' : micState === 'listening' ? 'mic-button mic-button--listening' : 'mic-button'

  if (isLoading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-panel loading-panel" aria-live="polite">
          <div className="status-pill status-pill--loading">System booting</div>
          <div className="loading-orb" />
          <h1>Initializing voice assistant</h1>
          <p>Loading system state and command history...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-panel error-panel" aria-live="assertive">
          <div className="status-pill status-pill--error">Connection error</div>
          <h1>Unable to connect</h1>
          <p role="alert">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry connection
          </button>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-panel empty-panel">
          <div className="status-pill">Standby</div>
          <h1>No data available</h1>
          <p>The assistant has not returned a state yet.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Voice Assistant Console</p>
            <h1>VoicePilot</h1>
          </div>

          <div
            className={`status-pill ${
              micState === 'idle' ? 'status-pill--idle' : micState === 'recording' ? 'status-pill--recording' : 'status-pill--live'
            }`}
          >
            {micStatusLabel}
          </div>
        </header>

        <div className="hero-area">
          <div className="ambient-ring ambient-ring--one" />
          <div className="ambient-ring ambient-ring--two" />

          <button
            type="button"
            className={micButtonClass}
            onClick={toggleMicState}
            aria-label={micState === 'idle' ? 'Start listening' : micState === 'listening' ? 'Start recording' : 'Stop recording'}
          >
            <span className="mic-icon">🎙️</span>
          </button>

          <div className="assistant-summary">
            <span className="summary-dot" />
            <span>{features.assistant?.status || 'ready'} | {micState}</span>
          </div>
        </div>

        <section className="chat-panel">
          <div className="chat-header">
            <span>Interaction history</span>
            <span className="chat-badge">{features.music?.count || 0} tracks synced</span>
          </div>

          <div className="transcript-list">
            {transcript.map((entry, index) => (
              <div
                key={`${entry.speaker}-${index}`}
                className={`message ${entry.speaker === 'User' ? 'message--user' : 'message--assistant'}`}
              >
                <span className="message-speaker">{entry.speaker}</span>
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">System</span>
            <strong>{data.status}</strong>
            <small>Operational</small>
          </article>

          <article className="stat-card">
            <span className="stat-label">Assistant</span>
            <strong>{features.assistant?.status || 'ready'}</strong>
            <small>Voice mode</small>
          </article>

          <article className="stat-card">
            <span className="stat-label">Music</span>
            <strong>{features.music?.count || 0}</strong>
            <small>Available tracks</small>
          </article>

          <article className="stat-card">
            <span className="stat-label">News</span>
            <strong>{features.news?.api_key_configured ? 'Live' : 'Offline'}</strong>
            <small>{features.news?.provider || 'News service'}</small>
          </article>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
