import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { fetchTransactions, subscribeToTransactions } from '../services/supabaseService.js'

export function useTransactionsData(userId) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const normalizeTransaction = useCallback((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount ?? 0)
  }), [])

  const loadTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await fetchTransactions(userId)
      setTransactions(data.map(normalizeTransaction))
    } catch (err) {
      setError(err.message || 'Unable to load transactions')
    } finally {
      setLoading(false)
    }
  }, [userId, normalizeTransaction])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    if (!userId) return undefined
    const channel = subscribeToTransactions(userId, (payload) => {
      setTransactions((prev) => {
        if (payload.eventType === 'INSERT') {
          return [normalizeTransaction(payload.new), ...prev]
        }
        if (payload.eventType === 'UPDATE') {
          return prev.map((transaction) => (transaction.id === payload.new.id ? normalizeTransaction(payload.new) : transaction))
        }
        if (payload.eventType === 'DELETE') {
          return prev.filter((transaction) => transaction.id !== payload.old.id)
        }
        return prev
      })
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, normalizeTransaction])

  const stats = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses
    }
  }, [transactions])

  return {
    transactions,
    stats,
    loading,
    error,
    refresh: loadTransactions
  }
}
