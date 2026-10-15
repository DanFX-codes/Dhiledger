export const sampleData = {
  currency: 'USD',
  periods: ['Last 30 days', 'Last quarter', 'Year to date'],
  totalExpenditure: { 'Last 30 days': 128460, 'Last quarter': 371280, 'Year to date': 1015820 },
  trend: [68000, 74200, 71600, 80400, 76800, 83400, 86600, 81200],
  categories: [
    { label: 'Cloud infrastructure', value: 48200, share: 38 },
    { label: 'Software subscriptions', value: 32600, share: 25 },
    { label: 'Vendor services', value: 28660, share: 22 },
    { label: 'Other technology', value: 19000, share: 15 },
  ],
  vendors: [
    { name: 'Cloud Provider A', category: 'Cloud infrastructure', amount: 48200, change: '+8.4%' },
    { name: 'Workflow Suite B', category: 'Software subscriptions', amount: 18600, change: '+2.1%' },
    { name: 'Data Services C', category: 'Vendor services', amount: 14660, change: '-3.2%' },
    { name: 'Security Tools D', category: 'Software subscriptions', amount: 14000, change: '+12.5%' },
    { name: 'Platform Vendor E', category: 'Vendor services', amount: 14000, change: '—' },
  ],
  insights: [
    { title: 'Cloud Provider A expenditure changed', detail: 'A sample period change is shown for investigation.', state: 'Review suggested', tone: 'amber' },
    { title: 'Workflow Suite B has overlapping seats', detail: 'A possible duplicate or unused service candidate.', state: 'Potential savings', tone: 'blue' },
    { title: 'Security Tools D renewal is approaching', detail: 'Review pricing, usage and renewal context before action.', state: 'Review suggested', tone: 'purple' },
  ],
  opportunities: [
    { title: 'Review overlapping workflow seats', owner: 'Finance + Engineering', state: 'Potential savings' },
    { title: 'Investigate cloud expenditure change', owner: 'Engineering', state: 'Reviewed opportunity' },
    { title: 'Confirm renewal assumptions', owner: 'Operations', state: 'Approved action' },
    { title: 'Compare an illustrative period', owner: 'Finance', state: 'Verified savings' },
  ],
  reports: ['Monthly technology spend review', 'Vendor expenditure review', 'Savings verification worksheet'],
  audit: [
    { time: '09:42', action: 'Sample opportunity reviewed', actor: 'Sample reviewer' },
    { time: '08:18', action: 'Sample expenditure period selected', actor: 'Sample analyst' },
    { time: 'Yesterday', action: 'Sample vendor table sorted', actor: 'Sample analyst' },
  ],
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: sampleData.currency, maximumFractionDigits: 0 }).format(value)
}
