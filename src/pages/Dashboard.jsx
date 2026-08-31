import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

const initialTranscript = [
  { speaker: 'VoicePilot', text: 'Good evening. I am online and ready to assist.' },
  { speaker: 'User', text: 'Play the stealth track.' },
  { speaker: 'VoicePilot', text: 'Opening the curated playlist for you.' },
  { speaker: 'User', text: 'Tell me the latest headlines.' },
  { speaker: 'VoicePilot', text: 'Fetching the top stories from the news feed.' }
]

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [micState, setMicState] = useState('idle')
  const [transcript, setTranscript] = useState(initialTranscript)
  const recognitionRef = useRef(null)

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

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      return undefined
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0].transcript.trim()

        if (result.isFinal) {
          finalText += `${text} `
        } else {
          interimText += `${text} `
        }
      }

      if (interimText.trim()) {
        setMicState('listening')
      }

      if (finalText.trim()) {
        const spokenText = finalText.trim()

        handleVoiceCommand(spokenText)
        setMicState('idle')
        recognition.stop()
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone permission was denied. Please allow mic access and try again.')
      } else if (event.error !== 'no-speech') {
        setError(`Voice recognition error: ${event.error}`)
      }
      setMicState('idle')
    }

    recognition.onend = () => {
      setMicState((prev) => (prev === 'recording' ? 'idle' : prev))
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const features = data?.features ?? {}

  const quickActions = [
    { label: 'Play music', tone: 'cyan' },
    { label: 'News brief', tone: 'violet' },
    { label: 'Weather', tone: 'green' }
  ]

  const liveInsights = [
    { label: 'Assistant', value: features.assistant?.status || 'ready' },
    { label: 'Music feed', value: `${features.music?.count || 0} synced` },
    { label: 'News feed', value: features.news?.api_key_configured ? 'online' : 'offline' }
  ]

  const handleVoiceCommand = async (command) => {
    const normalized = command.trim()

    if (!normalized) {
      return 'I did not catch a command. Please try again.'
    }

    try {
      const response = await api.post('/assistant/command', { command: normalized })
      const result = response.data || {}
      const message = result.message || 'I am ready for your next command.'

      if ((result.action === 'play_music' || result.action === 'open_site') && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      }

      setTranscript((prev) => [
        ...prev,
        { speaker: 'User', text: normalized },
        { speaker: 'VoicePilot', text: message }
      ].slice(-8))

      return message
    } catch (err) {
      const fallbackMessage = err?.response?.data?.detail || 'I had trouble processing that command.'
      setTranscript((prev) => [
        ...prev,
        { speaker: 'User', text: normalized },
        { speaker: 'VoicePilot', text: fallbackMessage }
      ].slice(-8))
      return fallbackMessage
    }
  }

  const toggleMicState = () => {
    const recognition = recognitionRef.current

    if (!recognition) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge on localhost.')
      return
    }

    if (micState === 'idle') {
      try {
        recognition.start()
        setError('')
        setMicState('listening')
      } catch (err) {
        setMicState('idle')
      }
      return
    }

    recognition.stop()
    setMicState('idle')
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

        <div className="dashboard-main">
          <section className="primary-column">
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
          </section>

          <aside className="side-panel">
            <div className="side-card side-card--highlight">
              <span className="side-label">Command engine</span>
              <strong>{features.assistant?.status || 'ready'}</strong>
              <small>{micStatusLabel}</small>
            </div>

            <div className="side-card">
              <span className="side-label">Quick actions</span>
              <div className="quick-actions">
                {quickActions.map((action) => (
                  <button key={action.label} type="button" className={`quick-action quick-action--${action.tone}`}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="side-card">
              <span className="side-label">Live status</span>
              <ul className="feature-list">
                {liveInsights.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
