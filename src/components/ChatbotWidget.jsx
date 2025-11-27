import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const greeting = `Hi! I'm RythmIQ's AI coach. Ask me about cashflow, savings moves, or budgeting tactics and I'll combine what I know from your workspace with the latest playbooks.`

function buildEndpoint() {
  const explicit = import.meta.env.VITE_RAG_CHAT_URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (explicit) return explicit
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/rag-chat`
  }
  return ''
}

export default function ChatbotWidget({ className = '' }) {
  const { user, session } = useAuth()
  const [messages, setMessages] = useState([{ id: 'intro', role: 'assistant', content: greeting }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sources, setSources] = useState([])
  const containerRef = useRef(null)
  const endpoint = buildEndpoint()

  useEffect(() => {
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
      }
    })
  }, [messages])

  const submitMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    if (!endpoint) {
      setError('Chat endpoint not configured. Set VITE_RAG_CHAT_URL or VITE_SUPABASE_URL.')
      return
    }

    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmed }
    const optimisticHistory = [...messages, userMessage]
    setMessages(optimisticHistory)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const headers = { 'Content-Type': 'application/json' }
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      if (endpoint.includes('.supabase.co') && anonKey) {
        headers.apikey = anonKey
        if (!headers.Authorization) {
          headers.Authorization = `Bearer ${anonKey}`
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: trimmed,
          history: optimisticHistory.slice(-8).map(({ role, content }) => ({ role, content })),
          userId: user?.id ?? null
        })
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail || 'Unable to reach the AI coach right now.')
      }

      const payload = await response.json()
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload.reply?.trim() || 'I need a moment before I can answer that.'
      }
      setMessages((prev) => [...prev, assistantMessage])
      setSources(Array.isArray(payload.sources) ? payload.sources : [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong while contacting the AI coach.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    submitMessage()
  }

  return (
    <section className={`chatbot-panel chatbot-panel--inline ${className}`.trim()} aria-label="RythmIQ AI Coach">
      <header className="chatbot-panel__head">
        <div>
          <p className="chatbot-panel__title">RythmIQ AI Coach</p>
          <span className="muted chatbot-panel__subtitle">Ask questions. Get tailored moves.</span>
        </div>
      </header>
      <div className="chatbot-messages" ref={containerRef}>
        {messages.map((message) => (
          <article key={message.id} className={`chatbot-message chatbot-message--${message.role}`}>
            <span>{message.content}</span>
          </article>
        ))}
        {loading && (
          <article className="chatbot-message chatbot-message--assistant chatbot-message--typing">
            <Loader2 size={16} className="spin" />
            <span>Thinking...</span>
          </article>
        )}
      </div>
      {error && <p className="feedback feedback--error">{error}</p>}
      {sources.length > 0 && (
        <div className="chatbot-sources">
          <p className="muted">Referenced knowledge</p>
          <ul>
            {sources.map((source) => (
              <li key={source.id}>
                <strong>{source.title || 'Untitled doc'}</strong>
                {source.tags?.length ? <span>{source.tags.join(', ')}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={endpoint ? 'Ask a money question…' : 'Configure VITE_RAG_CHAT_URL to enable chat'}
          disabled={loading || !endpoint}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim() || loading || !endpoint} aria-label="Send message">
          {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
        </button>
      </form>
    </section>
  )
}
