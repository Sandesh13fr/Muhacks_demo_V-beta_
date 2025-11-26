import { supabase } from '../lib/supabaseClient.js'

export async function upsertProfile(userId, payload) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    ...payload
  })
  if (error) throw error
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function fetchTransactions(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTransaction(userId, payload) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...payload, user_id: userId }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTransaction(transactionId, userId) {
  const { error } = await supabase.from('transactions').delete().eq('id', transactionId).eq('user_id', userId)
  if (error) throw error
}

export function subscribeToTransactions(userId, handler) {
  const channel = supabase
    .channel(`transactions:user:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      handler
    )
    .subscribe()
  return channel
}

export async function fetchFinancialGoals(userId) {
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchCoachingInsights(userId) {
  const [{ data: summaryData, error: summaryError }, { data: insightRows, error: insightError }] = await Promise.all([
    supabase
      .from('coaching_summary')
      .select('health_score, budget_advice, predictive_alerts')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('coaching_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  if (summaryError && summaryError.code !== 'PGRST116') throw summaryError
  if (insightError) throw insightError

  const mappedInsights = (insightRows || []).map((row) => ({
    id: row.id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    description: row.description,
    actionableAdvice: row.actionable_advice,
    expectedOutcome: row.expected_outcome,
    timeframe: row.timeframe,
    category: row.category,
    confidenceScore: Number(row.confidence_score ?? 0)
  }))

  return {
    healthScore: summaryData?.health_score ?? 68,
    budgetAdvice: summaryData?.budget_advice ?? null,
    predictiveAlerts: summaryData?.predictive_alerts ?? null,
    insights: mappedInsights
  }
}
