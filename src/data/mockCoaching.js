const insights = [
  {
    type: 'alert',
    priority: 'urgent',
    title: 'Utility bill is due soon',
    description: 'Your recurring internet bill posts in 3 days. Balance is currently lower than your 30-day average.',
    actionableAdvice: 'Move $80 from your holding buffer or log the payment to keep the streak alive.',
    expectedOutcome: 'Keeps your recurring score above 90 and avoids late fees.',
    timeframe: 'Pay within 72 hours.',
    category: 'utilities',
    confidenceScore: 0.82
  },
  {
    type: 'opportunity',
    priority: 'medium',
    title: 'Gig income spike detected',
    description: 'You earned 18% more than the typical week thanks to extra rideshare hours.',
    actionableAdvice: 'Allocate $120 to the emergency fund while momentum is high.',
    expectedOutcome: 'Pushes emergency fund progress to 56% this month.',
    timeframe: 'Make the transfer in the next 5 days.',
    category: 'savings',
    confidenceScore: 0.74
  },
  {
    type: 'prediction',
    priority: 'high',
    title: 'Cashflow dip ahead',
    description: 'Based on the last eight weeks, week 3 of every month runs tighter on cash.',
    actionableAdvice: 'Reduce discretionary spending by $40 next week or secure one more gig shift.',
    expectedOutcome: 'Keeps cushion above $400 through the volatility window.',
    timeframe: 'Next 10 days',
    category: 'cashflow',
    confidenceScore: 0.69
  }
]

export async function fetchCoachingInsights(payload) {
  console.log('[mock] Generate coaching insights', payload)
  await new Promise((resolve) => setTimeout(resolve, 800))
  return {
    healthScore: 72,
    insights,
    budgetAdvice:
      'Budget 55% for flexible spending, 25% for essentials, and move 20% into safety goals for the next 30 days.',
    predictiveAlerts: 'Income likely dips around the 18th. Time to schedule proactive outreach to top clients.'
  }
}
