const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'upgrade',
])

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined

  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined
}

function getBackendBaseUrl() {
  const backendBaseUrl = process.env.API_TARGET || process.env.BACKEND_URL

  if (!backendBaseUrl) {
    return null
  }

  return backendBaseUrl.replace(/\/$/, '')
}

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload))
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('content-length', String(body.length))
  res.end(body)
}

function forwardHeaders(sourceHeaders) {
  const headers = new Headers()

  for (const [key, value] of Object.entries(sourceHeaders)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
      continue
    }

    headers.set(key, value)
  }

  headers.delete('host')
  headers.delete('content-length')

  return headers
}

async function handler(req, res) {
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    sendJson(res, 500, {
      error: 'API_TARGET (or BACKEND_URL) is not configured for the Vercel proxy.',
    })
    return
  }

  const requestUrl = new URL(req.url || '/', 'http://localhost')
  const apiPath = requestUrl.pathname.replace(/^\/api/, '') || '/'
  const upstreamUrl = new URL(`${apiPath}${requestUrl.search}`, backendBaseUrl)

  const headers = forwardHeaders(req.headers)

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: await readBody(req),
      redirect: 'manual',
    })

    res.statusCode = upstream.status

    upstream.headers.forEach((value, key) => {
      const headerName = key.toLowerCase()
      if (HOP_BY_HOP_HEADERS.has(headerName)) return
      if (headerName === 'set-cookie') return
      res.setHeader(key, value)
    })

    const setCookies = typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : (upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')] : [])

    if (setCookies.length > 0) {
      res.setHeader('set-cookie', setCookies)
    }

    const body = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('content-length', String(body.length))
    res.end(body)
  } catch (error) {
    console.error('Vercel API proxy failed', error)
    sendJson(res, 502, {
      error: 'Failed to proxy API request to backend.',
    })
  }
}

module.exports = handler
