import { legalPages } from './config/content'

const marketing = [
  ['/', 'Home', 'Financial intelligence for technology-driven companies.', 'index'],
  ['/product', 'Product', 'Understand the intended Dhiledger product direction.', 'index'],
  ['/how-it-works', 'How it works', 'A six-stage workflow for investigating technology spend.', 'index'],
  ['/use-cases', 'Use cases', 'Where technology-spend intelligence is intended to help.', 'index'],
  ['/pricing', 'Pricing', 'Dhiledger pricing has not been published.', 'index'],
  ['/security', 'Security', 'A transparent overview of planned data stewardship practices.', 'index'],
  ['/about', 'About', 'The Dhiledger mission and product vision.', 'index'],
  ['/contact', 'Contact', 'Contact Dhiledger.', 'index'],
  ['/request-access', 'Request early access', 'Request early access to the Dhiledger direction.', 'index'],
  ['/faq', 'FAQ', 'Answers about the Dhiledger direction.', 'index'],
  ['/resources', 'Resources', 'Dhiledger resources.', 'noindex'],
]

const demo = [
  ['/demo', 'Demo overview', 'Read-only sample-data demonstration.', 'noindex'],
  ['/demo/spending', 'Demo spending', 'Sample-data spending view.', 'noindex'],
  ['/demo/vendors', 'Demo vendors', 'Sample-data vendor view.', 'noindex'],
  ['/demo/insights', 'Demo insights', 'Sample-data insights view.', 'noindex'],
  ['/demo/recommendations', 'Demo recommendations', 'Sample-data recommendations view.', 'noindex'],
  ['/demo/savings', 'Demo savings', 'Sample-data savings verification view.', 'noindex'],
  ['/demo/reports', 'Demo reports', 'Sample-data reports view.', 'noindex'],
  ['/demo/audit-log', 'Demo audit log', 'Sample-data audit log view.', 'noindex'],
  ['/demo/settings/profile', 'Demo profile settings', 'Sample-data settings layout.', 'noindex'],
  ['/demo/settings/organization', 'Demo organization settings', 'Sample-data settings layout.', 'noindex'],
  ['/demo/settings/data', 'Demo data settings', 'Sample-data settings layout.', 'noindex'],
  ['/demo/settings/privacy', 'Demo privacy settings', 'Sample-data settings layout.', 'noindex'],
]

const workspace = [
  ['/login', 'Sign in', 'Sign in to your Dhiledger workspace.', 'noindex'],
  ['/auth/callback', 'Signing in', 'Completing Google sign-in.', 'noindex'],
  ['/dashboard', 'Workspace dashboard', 'Your private technology-spend workspace.', 'noindex'],
  ['/dashboard/profile', 'Profile settings', 'Edit your Dhiledger account profile.', 'noindex'],
]

const unavailable = [
  ['/settings/*', 'Product not available', 'The live Dhiledger product is not available yet.', 'noindex'],
]

export const routeRegistry = [...marketing, ...demo, ...workspace, ...unavailable, ['/legal', 'Legal', 'Dhiledger legal templates.', 'noindex'], ...legalPages.map((page) => [page.path, page.title, page.title, 'noindex'])].map(([path, title, description, robots]) => ({ path, title, description, robots }))

export const routeLookup = new Map(routeRegistry.map((route) => [route.path, route]))
export const indexedRoutes = routeRegistry.filter((route) => route.robots === 'index' && !route.path.includes('*'))
export const demoPaths = demo.map(([path]) => path)
export const mainNav = ['/product', '/how-it-works', '/use-cases', '/pricing', '/security']
export const isRouteRegistered = (path) => routeRegistry.some((route) => route.path === path || (route.path.endsWith('/*') && path.startsWith(route.path.slice(0, -1))))
