export const pricing = { published: false, plans: [] }

export const faq = [
  { question: 'What is Dhiledger?', answer: 'Dhiledger is being designed to help finance and engineering teams understand technology, cloud, software, subscription and vendor spending.' },
  { question: 'Who is it designed for?', answer: 'It is intended for technology startups and scale-ups, SaaS, software and AI companies, and teams with significant technology spend.' },
  { question: 'Is Dhiledger available today?', answer: 'Dhiledger is pre-MVP. Early access is available by request while the product direction is developed.' },
  { question: 'What data would I need to get started?', answer: 'The intended MVP direction is CSV-first import of financial and expenditure data. Upload is not available on this website.' },
  { question: 'Does it connect to my bank, cloud or billing accounts?', answer: 'Not currently. Cloud, SaaS, accounting, billing and procurement connections are planned.' },
  { question: 'Does it promise savings?', answer: 'No. Identified opportunities are candidates for investigation and must be reviewed before any financial action.' },
  { question: 'How does savings verification work?', answer: 'The intended workflow compares relevant spending before and after an action, taking data quality, time periods, pricing changes and usage into account.' },
]

export const security = {
  certifications: [],
  statements: [
    { title: 'Least-privilege access', statement: 'Access should be limited to what is needed for the intended work.', verified: false, evidenceNote: '' },
    { title: 'Responsible data handling', statement: 'Financial data should be handled with clear boundaries and transparent operational practices.', verified: false, evidenceNote: '' },
    { title: 'Human review', statement: 'Important recommendations should remain subject to human review before financial action.', verified: false, evidenceNote: '' },
    { title: 'Auditable activity', statement: 'Important investigation activity should be reviewable where the product implements those records.', verified: false, evidenceNote: '' },
  ],
}

export const forms = {
  consentText: '',
  spendRanges: ['Prefer not to say', 'Under $10,000 per month', '$10,000–$50,000 per month', '$50,000–$250,000 per month', 'Over $250,000 per month'],
  interests: ['Spending visibility', 'Vendor expenditure', 'Cloud and software costs', 'Savings verification', 'Other'],
  maxMessageLength: 2000,
}

export const consent = { enabled: false, categories: [], copy: { title: '', description: '', accept: '', reject: '', preferences: '' } }

export const legalPages = [
  ['privacy-policy', 'Privacy Policy'],
  ['terms-of-service', 'Terms of Service / Terms and Conditions'],
  ['refund-policy', 'Refund Policy'],
  ['cookie-policy', 'Cookie Policy'],
  ['cancellation-and-subscription-policy', 'Cancellation and Subscription Policy'],
  ['acceptable-use-policy', 'Acceptable Use Policy'],
  ['data-processing-addendum', 'Data Processing Addendum (DPA)'],
  ['intellectual-property-and-copyright-notice', 'Intellectual Property and Copyright Notice'],
  ['data-retention-and-deletion-policy', 'Data Retention and Deletion Policy'],
  ['ai-and-automated-analysis-disclosure', 'AI and Automated Analysis Disclosure'],
  ['third-party-services-and-subprocessors', 'Third-Party Services and Subprocessor List'],
  ['service-level-agreement', 'Service Level Agreement (SLA)'],
  ['accessibility-statement', 'Accessibility Statement'],
  ['financial-and-product-disclaimer', 'Financial and Product Disclaimer'],
  ['responsible-disclosure-policy', 'Security Disclosure / Responsible Disclosure Policy'],
  ['open-source-and-third-party-notices', 'Open-Source and Third-Party Notices'],
  ['legal-notices-and-company-information', 'Legal Notices and Company Information'],
].map(([slug, title]) => ({ slug, path: `/legal/${slug}`, title, footerGroup: 'Legal', contentReady: false }))
