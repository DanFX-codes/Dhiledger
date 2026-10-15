import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const warnings = []
const envSite = process.env.VITE_SITE_URL || ''
const envForm = process.env.VITE_FORM_ENDPOINT || ''
const legalSlugs = ['privacy-policy', 'terms-of-service', 'refund-policy', 'cookie-policy', 'cancellation-and-subscription-policy', 'acceptable-use-policy', 'data-processing-addendum', 'intellectual-property-and-copyright-notice', 'data-retention-and-deletion-policy', 'ai-and-automated-analysis-disclosure', 'third-party-services-and-subprocessors', 'service-level-agreement', 'accessibility-statement', 'financial-and-product-disclaimer', 'responsible-disclosure-policy', 'open-source-and-third-party-notices', 'legal-notices-and-company-information']
const companyFile = fs.readFileSync(path.join(root, 'src/config/company.js'), 'utf8')
const securityFile = fs.readFileSync(path.join(root, 'src/config/content.js'), 'utf8')

if (!envSite) warnings.push('VITE_SITE_URL is empty: canonical metadata and sitemap generation are skipped.')
if (!envForm) warnings.push('VITE_FORM_ENDPOINT is empty: forms are visible but cannot receive submissions.')
if (companyFile.match(/legalName: ''|email: ''|phone: ''/g)?.length) warnings.push('Company/contact configuration contains empty fields.')
if (securityFile.includes('verified: false')) warnings.push('Security statements remain unverified and render as Planned approach.')
warnings.push('Consent is disabled by default until the real cookie/tool inventory and copy are supplied.')
warnings.push(`All ${legalSlugs.length} legal templates are empty and remain unpublished.`)
warnings.push('Pricing is not published.')
warnings.push('FAQ answers about storage, retention, deletion and certifications are omitted until confirmed.')

console.log('Dhiledger prelaunch check: warnings are advisory and do not prove feature readiness.')
warnings.forEach((warning) => console.warn(`WARNING: ${warning}`))
if (process.env.STRICT_PRELAUNCH === 'true' && warnings.length) process.exitCode = 1
