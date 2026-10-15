const rawSiteUrl = (import.meta.env.VITE_SITE_URL || '').trim()
const rawFormEndpoint = (import.meta.env.VITE_FORM_ENDPOINT || '').trim()
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

function validSiteUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.origin : ''
  } catch {
    return ''
  }
}

function validFormEndpoint(value) {
  try {
    const url = new URL(value)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol !== 'https:' && !(import.meta.env.DEV && isLocal && url.protocol === 'http:')) return ''
    return url.toString()
  } catch {
    return ''
  }
}

function validSupabaseUrl(value) {
  try {
    const url = new URL(value)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol !== 'https:' && !(import.meta.env.DEV && isLocal && url.protocol === 'http:')) return ''
    return url.origin
  } catch {
    return ''
  }
}

const supabaseUrl = validSupabaseUrl(rawSupabaseUrl)

export const env = {
  siteUrl: validSiteUrl(rawSiteUrl),
  formEndpoint: validFormEndpoint(rawFormEndpoint),
  supabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
  hasSiteUrl: Boolean(validSiteUrl(rawSiteUrl)),
  hasFormEndpoint: Boolean(validFormEndpoint(rawFormEndpoint)),
  hasSupabase: Boolean(supabaseUrl && rawSupabaseAnonKey),
}
