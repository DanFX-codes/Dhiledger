export const capabilities = [
  { id: 'spend-visibility', title: 'Spend visibility', description: 'Organize technology and vendor expenditure into a clearer view for investigation.', status: 'prototype' },
  { id: 'vendor-analysis', title: 'Vendor expenditure analysis', description: 'Review vendor spend across the categories and periods that matter to your team.', status: 'planned' },
  { id: 'duplicates', title: 'Potential duplicate or unused services', description: 'Surface candidates for reviewing overlapping or underused subscriptions.', status: 'prototype' },
  { id: 'unusual', title: 'Unusual expenditure identification', description: 'Highlight expenditure changes that may warrant a closer look.', status: 'prototype' },
  { id: 'recommendations', title: 'Evidence-based savings recommendations', description: 'Present candidate opportunities with clear context for human review.', status: 'planned' },
  { id: 'verification', title: 'Savings verification', description: 'Compare relevant periods to see whether an expected change occurred.', status: 'planned' },
  { id: 'reporting', title: 'Exportable reporting', description: 'Prepare reports that help teams communicate investigated findings.', status: 'planned' },
  { id: 'audit-records', title: 'Audit-oriented activity records', description: 'Keep a reviewable record of important investigation activity where implemented.', status: 'planned' },
]

export const capabilityMap = Object.fromEntries(capabilities.map((capability) => [capability.id, capability]))
