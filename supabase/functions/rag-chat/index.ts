// @ts-ignore: remote ESM import used at runtime; TypeScript may not have type declarations for this URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
}

const globalEnv = globalThis as typeof globalThis & {
  Deno?: { env?: { get(key: string): string | undefined }; serve?: (...args: any[]) => any }
  process?: { env?: Record<string, string | undefined> }
}

const getEnv = (key: string): string =>
  globalEnv?.Deno?.env?.get?.(key) ?? globalEnv?.process?.env?.[key] ?? ''

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL')
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_ROLE') || getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY')
const geminiApiKey = getEnv('GEMINI_API_KEY')
const geminiModel = getEnv('GEMINI_MODEL') || 'gemini-1.5-flash-latest'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials for rag-chat function.')
}

if (!geminiApiKey) {
  console.error('Missing GEMINI_API_KEY environment variable for rag-chat function.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const systemPrompt = `You are Legend's on-call AI money coach. Combine the provided knowledge base passages with prior chat context to give clear, affirmative, and actionable financial guidance. Reference applicable snippets from the knowledge base when useful, and ask clarifying questions when information is missing. Format insights as short paragraphs or bullet lists and keep the tone supportive.`

function sanitizeQuery(query: string) {
  return query.replace(/[\%_]/g, ' ').slice(0, 512)
}

async function fetchContext(query: string) {
  const sanitized = sanitizeQuery(query)
  let builder = supabase.from('rag_documents').select('id,title,content,tags').limit(5)
  if (sanitized.trim()) {
    builder = builder.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
  }
  const { data, error } = await builder
  if (error) {
    console.error('Failed to load rag_documents', error)
    throw error
  }
  if (data && data.length) {
    return data
  }
  const { data: fallback, error: fallbackError } = await supabase.from('rag_documents').select('id,title,content,tags').limit(5)
  if (fallbackError) {
    console.error('Failed to load fallback rag_documents', fallbackError)
    throw fallbackError
  }
  return fallback ?? []
}

function buildPrompt(message: string, history: Array<{ role: string; content: string }>, documents: any[], userId?: string) {
  const historyBlock = history
    .slice(-8)
    .map((entry) => `${entry.role === 'assistant' ? 'Coach' : 'User'}: ${entry.content}`)
    .join('\n')

  const contextBlock = documents
    .map((doc, index) => `Source ${index + 1} (${doc.title ?? 'Untitled'}):\n${doc.content}`)
    .join('\n---\n')

  return [
    systemPrompt,
    userId ? `The authenticated Supabase user id is ${userId}.` : '',
    contextBlock ? `Knowledge base passages:\n${contextBlock}` : 'No knowledge base context was retrieved. Focus on general coaching best practices.',
    historyBlock ? `Recent conversation history:\n${historyBlock}` : '',
    `User question: ${message}`,
    'Respond with concise, compassionate financial coaching guidance. Reference specific sources when applicable.'
  ]
    .filter(Boolean)
    .join('\n\n')
}

async function callGemini(prompt: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini request failed: ${errorText}`)
  }

  const data = await response.json()
  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('\n')
      .trim() ?? 'I was unable to generate a response just now.'

  return reply
}

const serve = globalEnv.Deno?.serve ?? (globalThis as any).serve

if (!serve) {
  throw new Error('No serve implementation found for rag-chat function.')
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const message = typeof payload?.message === 'string' ? payload.message.trim() : ''
    const history = Array.isArray(payload?.history) ? payload.history : []
    const userId = typeof payload?.userId === 'string' ? payload.userId : undefined

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const documents = await fetchContext(message)
    const prompt = buildPrompt(message, history, documents, userId)
    const reply = await callGemini(prompt)

    return new Response(JSON.stringify({ reply, sources: documents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    console.error('rag-chat error', error)
    const message = error instanceof Error ? error.message : String(error ?? 'Unexpected error generating response.')
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
