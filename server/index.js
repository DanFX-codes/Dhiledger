import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { randomUUID } from 'node:crypto'

const app = express()
const port = Number(process.env.PORT || 4000)
const jwtSecret = process.env.JWT_SECRET || 'dev-dhiledger-secret'

const db = {
  users: new Map(),
  organizations: new Map(),
  memberships: new Map(),
  imports: new Map(),
  transactions: new Map(),
  findings: new Map(),
  savings: new Map(),
  audit: new Map(),
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024) } })

const normalizeCurrency = (value) => (value || 'USD').toString().trim().toUpperCase()
const roundMoney = (amount) => Number(Number(amount || 0).toFixed(2))
const asDateIso = (value) => {
  if (!value) return null
  const trimmed = value.toString().trim()
  const match = trimmed.match(/^\d{4}-\d{2}-\d{2}$/)
  if (match) return trimmed
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

const createToken = (user) => jwt.sign({ sub: user.id, email: user.email, orgId: user.currentOrganizationId || null }, jwtSecret, { expiresIn: '12h' })
const sanitizeUser = (user) => ({ id: user.id, email: user.email, fullName: user.fullName, companyName: user.companyName, locale: user.locale, createdAt: user.createdAt })
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required.' })

  try {
    const payload = jwt.verify(token, jwtSecret)
    req.user = { id: payload.sub, email: payload.email, currentOrganizationId: payload.orgId }
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }
}

const requireOrgAccess = (req, res, next) => {
  const organizationId = req.params.organizationId || req.body.organizationId || req.user.currentOrganizationId
  if (!organizationId) return res.status(400).json({ message: 'Organization context is required.' })
  const organization = db.organizations.get(organizationId)
  if (!organization) return res.status(404).json({ message: 'Organization not found.' })
  const membership = Array.from(db.memberships.values()).find((entry) => entry.organizationId === organizationId && entry.userId === req.user.id)
  if (!membership) return res.status(403).json({ message: 'You do not have access to this organization.' })
  req.organization = organization
  req.membership = membership
  return next()
}

const addAuditEvent = (organizationId, userId, entityType, entityId, action, details) => {
  db.audit.set(randomUUID(), {
    id: randomUUID(),
    organizationId,
    userId,
    entityType,
    entityId,
    action,
    details,
    createdAt: new Date().toISOString(),
  })
}

const parseCsvPayload = (fileBuffer) => {
  const rows = parse(fileBuffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const requiredHeaders = ['transaction_date', 'vendor', 'description', 'amount', 'currency']
  if (!rows.length) {
    return { valid: false, message: 'The uploaded CSV is empty.' }
  }

  const headers = Object.keys(rows[0]).map((header) => header.toLowerCase().trim())
  const missing = requiredHeaders.filter((header) => !headers.includes(header))
  if (missing.length) {
    return { valid: false, message: `Missing required CSV columns: ${missing.join(', ')}` }
  }

  const normalizedRows = rows.map((row, index) => {
    const amountValue = Number(String(row.amount || '').replace(/[$,\s]/g, '').replace(/\((.*)\)/, '-$1'))
    const isValid = !Number.isNaN(amountValue) && String(row.transaction_date || '').trim() && String(row.vendor || '').trim() && String(row.description || '').trim()
    return {
      index: index + 2,
      row,
      valid: isValid,
      amount: amountValue,
      date: asDateIso(row.transaction_date),
      vendor: String(row.vendor || '').trim(),
      description: String(row.description || '').trim(),
      currency: normalizeCurrency(row.currency),
    }
  })

  const invalidRows = normalizedRows.filter((entry) => !entry.valid)
  return {
    valid: invalidRows.length === 0,
    headers,
    rows: normalizedRows,
    invalidRows,
    message: invalidRows.length ? 'Some rows are invalid and must be corrected before import.' : 'CSV is ready to import.',
  }
}

app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'dhiledger-api', timestamp: new Date().toISOString() }))

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, companyName } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const userExists = Array.from(db.users.values()).some((user) => user.email.toLowerCase() === String(email).toLowerCase())
  if (userExists) {
    return res.status(409).json({ message: 'An account with that email already exists.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = {
    id: randomUUID(),
    email: String(email).trim(),
    passwordHash,
    fullName: String(fullName || '').trim(),
    companyName: String(companyName || '').trim(),
    locale: 'en',
    createdAt: new Date().toISOString(),
  }

  db.users.set(user.id, user)

  const organization = {
    id: randomUUID(),
    name: String(companyName || 'My organization').trim() || 'My organization',
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }

  db.organizations.set(organization.id, organization)
  db.memberships.set(randomUUID(), { id: randomUUID(), userId: user.id, organizationId: organization.id, role: 'OWNER', createdAt: new Date().toISOString() })

  const token = createToken({ ...user, currentOrganizationId: organization.id })
  return res.status(201).json({ token, user: sanitizeUser(user), organization })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  const user = Array.from(db.users.values()).find((entry) => entry.email.toLowerCase() === String(email || '').toLowerCase())
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' })

  const validPassword = await bcrypt.compare(String(password || ''), user.passwordHash)
  if (!validPassword) return res.status(401).json({ message: 'Invalid email or password.' })

  const memberships = Array.from(db.memberships.values()).filter((entry) => entry.userId === user.id)
  const defaultOrg = memberships[0]?.organizationId || null
  const token = createToken({ ...user, currentOrganizationId: defaultOrg })
  const org = defaultOrg ? db.organizations.get(defaultOrg) : null
  return res.json({ token, user: sanitizeUser(user), organization: org })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.users.get(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found.' })
  return res.json({ user: sanitizeUser(user) })
})

app.get('/api/organizations', requireAuth, (req, res) => {
  const memberships = Array.from(db.memberships.values()).filter((entry) => entry.userId === req.user.id)
  const organizations = memberships.map((entry) => db.organizations.get(entry.organizationId)).filter(Boolean)
  return res.json({ organizations })
})

app.post('/api/organizations', requireAuth, (req, res) => {
  const { name } = req.body || {}
  const trimmedName = String(name || '').trim()
  if (!trimmedName) return res.status(400).json({ message: 'Organization name is required.' })
  const organization = { id: randomUUID(), name: trimmedName, createdBy: req.user.id, createdAt: new Date().toISOString() }
  db.organizations.set(organization.id, organization)
  db.memberships.set(randomUUID(), { id: randomUUID(), userId: req.user.id, organizationId: organization.id, role: 'OWNER', createdAt: new Date().toISOString() })
  addAuditEvent(organization.id, req.user.id, 'organization', organization.id, 'created', { name: trimmedName })
  return res.status(201).json({ organization })
})

app.post('/api/organizations/:organizationId/imports/upload', requireAuth, requireOrgAccess, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A CSV file is required.' })

  const payload = parseCsvPayload(req.file.buffer)
  if (!payload.valid) {
    return res.status(400).json({ message: payload.message, preview: payload.rows?.slice(0, 5) || [] })
  }

  const importRecord = {
    id: randomUUID(),
    organizationId: req.organization.id,
    userId: req.user.id,
    filename: req.file.originalname,
    importIdentifier: `import-${Date.now()}`,
    status: 'IMPORTED',
    rowCount: payload.rows.length,
    acceptedCount: payload.rows.length,
    rejectedCount: 0,
    skippedCount: 0,
    createdAt: new Date().toISOString(),
  }

  db.imports.set(importRecord.id, importRecord)

  const transactions = payload.rows.map((entry) => ({
    id: randomUUID(),
    organizationId: req.organization.id,
    userId: req.user.id,
    importId: importRecord.id,
    transactionDate: entry.date,
    vendor: entry.vendor,
    description: entry.description,
    amount: roundMoney(entry.amount),
    currency: entry.currency,
    reference: String(entry.row.reference || `${req.organization.id}-${entry.index}`).trim() || `${req.organization.id}-${entry.index}`,
    category: String(entry.row.category || '').trim() || 'Uncategorized',
    account: String(entry.row.account || '').trim(),
    department: String(entry.row.department || '').trim(),
    paymentStatus: String(entry.row.payment_status || '').trim(),
    createdAt: new Date().toISOString(),
  }))

  transactions.forEach((transaction) => db.transactions.set(transaction.id, transaction))

  addAuditEvent(req.organization.id, req.user.id, 'import', importRecord.id, 'processed', { rowCount: transactions.length })

  return res.status(201).json({ import: importRecord, preview: transactions.slice(0, 5) })
})

app.get('/api/organizations/:organizationId/dashboard', requireAuth, requireOrgAccess, (req, res) => {
  const txns = Array.from(db.transactions.values()).filter((entry) => entry.organizationId === req.organization.id)
  const totalsByCurrency = txns.reduce((accumulator, transaction) => {
    accumulator[transaction.currency] = (accumulator[transaction.currency] || 0) + Number(transaction.amount)
    return accumulator
  }, {})

  const topVendors = Object.entries(txns.reduce((accumulator, transaction) => {
    accumulator[transaction.vendor] = (accumulator[transaction.vendor] || 0) + Number(transaction.amount)
    return accumulator
  }, {})).sort(([, left], [, right]) => right - left).slice(0, 10)

  const findings = Array.from(db.findings.values()).filter((entry) => entry.organizationId === req.organization.id)
  const savings = Array.from(db.savings.values()).filter((entry) => entry.organizationId === req.organization.id)

  return res.json({
    organizationId: req.organization.id,
    totalsByCurrency,
    transactionCount: txns.length,
    topVendors,
    unresolvedFindings: findings.filter((entry) => !['RESOLVED', 'DISMISSED'].includes(entry.status)).length,
    potentialSavings: savings.filter((entry) => entry.status === 'POTENTIAL').reduce((sum, entry) => sum + Number(entry.claimedAmount || entry.baselineAmount || 0), 0),
    claimedSavings: savings.filter((entry) => entry.status === 'CLAIMED').reduce((sum, entry) => sum + Number(entry.claimedAmount || 0), 0),
    verifiedSavings: savings.filter((entry) => entry.status === 'VERIFIED').reduce((sum, entry) => sum + Number(entry.actualAmount || 0), 0),
  })
})

app.get('/api/organizations/:organizationId/transactions', requireAuth, requireOrgAccess, (req, res) => {
  const txns = Array.from(db.transactions.values()).filter((entry) => entry.organizationId === req.organization.id)
  return res.json({ transactions: txns, total: txns.length })
})

app.get('/api/organizations/:organizationId/findings', requireAuth, requireOrgAccess, (req, res) => {
  const findings = Array.from(db.findings.values()).filter((entry) => entry.organizationId === req.organization.id)
  return res.json({ findings })
})

app.post('/api/organizations/:organizationId/findings', requireAuth, requireOrgAccess, (req, res) => {
  const { title, type, estimatedAmount, currency, explanation, severity } = req.body || {}
  const finding = {
    id: randomUUID(),
    organizationId: req.organization.id,
    userId: req.user.id,
    title: String(title || 'Finding').trim() || 'Finding',
    type: String(type || 'UNKNOWN').trim(),
    status: 'NEW',
    severity: severity || 'MEDIUM',
    estimatedAmount: roundMoney(estimatedAmount || 0),
    currency: normalizeCurrency(currency),
    ruleVersion: 'v1.0.0',
    detectionDate: new Date().toISOString(),
    explanation: String(explanation || 'Detected from imported transaction data.'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.findings.set(finding.id, finding)
  addAuditEvent(req.organization.id, req.user.id, 'finding', finding.id, 'created', { title: finding.title })
  return res.status(201).json({ finding })
})

app.post('/api/organizations/:organizationId/findings/:findingId/review', requireAuth, requireOrgAccess, (req, res) => {
  const finding = db.findings.get(req.params.findingId)
  if (!finding || finding.organizationId !== req.organization.id) {
    return res.status(404).json({ message: 'Finding not found.' })
  }

  const { status, note } = req.body || {}
  finding.status = String(status || finding.status)
  finding.updatedAt = new Date().toISOString()
  db.findings.set(finding.id, finding)

  if (note) {
    db.audit.set(randomUUID(), {
      id: randomUUID(),
      organizationId: req.organization.id,
      userId: req.user.id,
      entityType: 'finding-note',
      entityId: finding.id,
      action: 'review-note',
      details: { note },
      createdAt: new Date().toISOString(),
    })
  }

  addAuditEvent(req.organization.id, req.user.id, 'finding', finding.id, 'status-change', { status: finding.status })
  return res.json({ finding })
})

app.get('/api/organizations/:organizationId/savings', requireAuth, requireOrgAccess, (req, res) => {
  const savings = Array.from(db.savings.values()).filter((entry) => entry.organizationId === req.organization.id)
  return res.json({ savings })
})

app.post('/api/organizations/:organizationId/savings', requireAuth, requireOrgAccess, (req, res) => {
  const { vendor, description, currency, baselineAmount, baselinePeriod, claimedAmount, status = 'POTENTIAL' } = req.body || {}
  const record = {
    id: randomUUID(),
    organizationId: req.organization.id,
    userId: req.user.id,
    vendor: String(vendor || 'Vendor').trim(),
    description: String(description || 'Savings opportunity').trim(),
    currency: normalizeCurrency(currency),
    baselineAmount: roundMoney(baselineAmount || 0),
    baselinePeriod: String(baselinePeriod || 'current-month').trim(),
    claimedAmount: roundMoney(claimedAmount || 0),
    actualAmount: roundMoney(claimedAmount || 0),
    actualPeriod: String(baselinePeriod || 'current-month').trim(),
    status: String(status).toUpperCase(),
    verificationNotes: '',
    reviewerId: null,
    reviewedAt: null,
    evidence: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.savings.set(record.id, record)
  addAuditEvent(req.organization.id, req.user.id, 'savings', record.id, 'created', { status: record.status })
  return res.status(201).json({ record })
})

app.get('/api/organizations/:organizationId/reports/summary', requireAuth, requireOrgAccess, (req, res) => {
  const txns = Array.from(db.transactions.values()).filter((entry) => entry.organizationId === req.organization.id)
  const findings = Array.from(db.findings.values()).filter((entry) => entry.organizationId === req.organization.id)
  const data = {
    generatedAt: new Date().toISOString(),
    period: 'last-30-days',
    transactionCount: txns.length,
    spendByCurrency: Object.entries(txns.reduce((accumulator, transaction) => {
      accumulator[transaction.currency] = (accumulator[transaction.currency] || 0) + Number(transaction.amount)
      return accumulator
    }, {})),
    findingsCount: findings.length,
    unresolvedFindings: findings.filter((entry) => !['RESOLVED', 'DISMISSED'].includes(entry.status)).length,
    dataCoverage: 'Live API data when a database is configured. Local development uses in-memory storage until DATABASE_URL is set.',
  }
  return res.json({ report: data })
})

app.listen(port, () => {
  console.log(`Dhiledger API listening on http://localhost:${port}`)
})
