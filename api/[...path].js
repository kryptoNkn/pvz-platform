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

function json(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload))
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('content-length', String(body.length))
  res.end(body)
}

function text(res, statusCode, payload, contentType = 'text/plain; charset=utf-8') {
  const body = Buffer.from(payload)
  res.statusCode = statusCode
  res.setHeader('content-type', contentType)
  res.setHeader('content-length', String(body.length))
  res.end(body)
}

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

function createDemoState() {
  const now = new Date()
  const isoNow = now.toISOString()
  const plusDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  return {
    profile: {
      id: 'demo-user',
      full_name: 'Андрей Артемов',
      phone: '+7 (999) 000-00-00',
      role: 'owner',
      created_at: '2026-01-10T09:00:00.000Z',
      avatar_url: null,
      company_name: 'ПВЗ Master',
      inn: '7700000000',
      kpp: '770001001',
      ogrn: '1237700000000',
      bank_name: 'Т-Банк',
      bik: '044525974',
      bank_account: '40817810000000000001',
      corr_account: '30101810145250000974',
      legal_address: 'Москва, ул. Тверская, 1',
    },
    documents: [
      {
        id: 'doc-1',
        filename: 'passport.pdf',
        url: 'https://example.com/passport.pdf',
        uploaded_at: '2026-05-01T12:00:00.000Z',
      },
    ],
    users: [
      { id: 'demo-user', full_name: 'Андрей Артемов', role: 'owner' },
      { id: 'user-2', full_name: 'Даниил Жданюк', role: 'admin' },
      { id: 'user-3', full_name: 'Алексей Пчелкин', role: 'operator' },
      { id: 'user-4', full_name: 'Егор Руденко', role: 'operator' },
    ],
    pvz: [
      {
        id: 'pvz-1',
        name: 'ПВЗ Тверская',
        address: 'Москва, ул. Тверская, 1',
        status: 'active',
        load_percent: 74,
        max_capacity: 120,
        location_type: 'street',
        traffic: 'high',
        hours: '09:00-21:00',
        marketplace: 'Ozon',
      },
      {
        id: 'pvz-2',
        name: 'ПВЗ Парк Культуры',
        address: 'Москва, Комсомольский проспект, 15',
        status: 'overloaded',
        load_percent: 128,
        max_capacity: 90,
        location_type: 'mall',
        traffic: 'medium',
        hours: '09:00-22:00',
        marketplace: 'WB',
      },
      {
        id: 'pvz-3',
        name: 'ПВЗ Хамовники',
        address: 'Москва, ул. Льва Толстого, 16',
        status: 'closed',
        load_percent: 0,
        max_capacity: 80,
        location_type: 'residential',
        traffic: 'low',
        hours: '10:00-20:00',
        marketplace: 'Яндекс Маркет',
      },
    ],
    schedules: {
      'pvz-1': Array.from({ length: 7 }, () => ({ is_day_off: false, start_time: '09:00', end_time: '21:00' })),
      'pvz-2': Array.from({ length: 7 }, () => ({ is_day_off: false, start_time: '09:00', end_time: '22:00' })),
      'pvz-3': Array.from({ length: 7 }, () => ({ is_day_off: false, start_time: '10:00', end_time: '20:00' })),
    },
    ops: [
      { id: 'op-1', pvz_id: 'pvz-1', pvz_name: 'ПВЗ Тверская', op_type: 'in', quantity: 12, note: 'Приёмка', created_at: plusDays(-1) },
      { id: 'op-2', pvz_id: 'pvz-1', pvz_name: 'ПВЗ Тверская', op_type: 'out', quantity: 34, note: 'Выдача', created_at: plusDays(-1) },
      { id: 'op-3', pvz_id: 'pvz-2', pvz_name: 'ПВЗ Парк Культуры', op_type: 'return', quantity: 7, note: 'Возврат', created_at: isoNow },
      { id: 'op-4', pvz_id: 'pvz-2', pvz_name: 'ПВЗ Парк Культуры', op_type: 'out', quantity: 19, note: 'Выдача', created_at: isoNow },
    ],
    marketplaceItems: [
      { marketplace: 'Ozon', items_count: 124, commission_percent: 12, avg_price: 1450, avg_storage_days: 4, pending_today: 28 },
      { marketplace: 'WB', items_count: 98, commission_percent: 10, avg_price: 1320, avg_storage_days: 5, pending_today: 17 },
      { marketplace: 'Яндекс Маркет', items_count: 61, commission_percent: 11, avg_price: 1590, avg_storage_days: 3, pending_today: 10 },
      { marketplace: 'Авито', items_count: 45, commission_percent: 8, avg_price: 980, avg_storage_days: 6, pending_today: 6 },
    ],
    orders: [
      {
        id: 'ord-1',
        marketplace: 'Ozon',
        external_id: 'OZ-482913',
        status: 'ready',
        created_at: plusDays(-1),
        items: [
          { name: 'Кроссовки', article: 'A-1291', quantity: 1, price: 5490 },
          { name: 'Рюкзак', article: 'A-2199', quantity: 2, price: 2490 },
        ],
      },
      {
        id: 'ord-2',
        marketplace: 'WB',
        external_id: 'WB-772104',
        status: 'in_transit',
        created_at: isoNow,
        items: [{ name: 'Футболка', article: 'B-1133', quantity: 3, price: 1290 }],
      },
    ],
    metrics: {
      lastSync: Math.floor(Date.now() / 1000) - 3600,
    },
    seq: 100,
  }
}

function getDemoState() {
  if (!globalThis.__PVZ_DEMO_STATE) {
    globalThis.__PVZ_DEMO_STATE = createDemoState()
  }

  return globalThis.__PVZ_DEMO_STATE
}

function nextId(state, prefix) {
  state.seq += 1
  return `${prefix}-${state.seq}`
}

function computeStats(state) {
  const total = state.pvz.length
  const active = state.pvz.filter((item) => item.status === 'active').length
  const overloaded = state.pvz.filter((item) => item.status === 'overloaded').length
  const closed = state.pvz.filter((item) => item.status === 'closed').length
  const operations = state.ops.reduce(
    (acc, item) => {
      acc.total_items += item.quantity
      acc[item.op_type] += item.quantity
      return acc
    },
    { total_items: 0, acceptance: 0, delivery: 0, returns: 0 }
  )

  return {
    total,
    active,
    overloaded,
    closed,
    total_items: operations.total_items,
    acceptance: operations.acceptance,
    delivery: operations.delivery,
    returns: operations.returns,
  }
}

function computeFinance(state) {
  const stats = computeStats(state)
  const monthly = [
    { month: '2026-03', revenue: 1240000, expenses: 820000 },
    { month: '2026-04', revenue: 1315000, expenses: 848000 },
    { month: '2026-05', revenue: 1422000, expenses: 892000 },
  ]
  const breakdown = state.marketplaceItems.map((item) => {
    const revenue = Math.round(item.items_count * item.avg_price * item.commission_percent / 100)
    return {
      marketplace: item.marketplace,
      items_delivered: item.items_count,
      avg_commission: item.commission_percent,
      revenue,
    }
  })

  const totalRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = monthly.reduce((sum, item) => sum + item.expenses, 0)

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_profit: totalRevenue - totalExpenses,
    avg_check: stats.delivery > 0 ? Math.round(totalRevenue / stats.delivery) : 0,
    transactions: stats.total_items,
    delivery_count: stats.delivery,
    acceptance_count: stats.acceptance,
    returns_count: stats.returns,
    monthly,
    breakdown,
  }
}

function parseJsonBody(rawBody) {
  if (!rawBody) return {}

  try {
    return JSON.parse(Buffer.from(rawBody).toString('utf8'))
  } catch {
    return {}
  }
}

function matches(pathname, pattern) {
  return pathname === pattern || pathname.startsWith(`${pattern}/`)
}

async function handleDemo(req, res, requestUrl, pathname) {
  const state = getDemoState()

  if (req.method === 'GET' && pathname === '/health') {
    json(res, 200, { ok: true })
    return true
  }

  if (req.method === 'GET' && pathname === '/ready') {
    json(res, 200, { ok: true })
    return true
  }

  if (req.method === 'GET' && pathname === '/metrics') {
    res.statusCode = 200
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.end(`marketplace_sync_last_success_timestamp ${state.metrics.lastSync}\n`)
    return true
  }

  if (pathname === '/auth/login' && req.method === 'POST') {
    const body = parseJsonBody(await readBody(req))
    const phone = String(body.phone ?? '').replace(/\D/g, '')
    if (!phone) {
      text(res, 400, 'Неверный номер телефона или пароль')
      return true
    }

    res.setHeader('set-cookie', 'demo_session=1; Path=/; SameSite=Lax')
    json(res, 200, { ok: true, role: state.profile.role })
    return true
  }

  if (pathname === '/auth/register' && req.method === 'POST') {
    const body = parseJsonBody(await readBody(req))
    const fullName = String(body.full_name ?? '').trim()
    const phone = String(body.phone ?? '').replace(/\D/g, '')
    if (!fullName || !phone) {
      text(res, 400, 'Ошибка регистрации')
      return true
    }

    res.setHeader('set-cookie', 'demo_session=1; Path=/; SameSite=Lax')
    state.profile.full_name = fullName
    state.profile.phone = phone
    json(res, 200, { ok: true, role: 'operator' })
    return true
  }

  if (pathname === '/auth/logout' && req.method === 'POST') {
    res.setHeader('set-cookie', 'demo_session=; Max-Age=0; Path=/; SameSite=Lax')
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/user/profile' && req.method === 'GET') {
    json(res, 200, state.profile)
    return true
  }

  if (pathname === '/user/profile' && req.method === 'PUT') {
    const body = parseJsonBody(await readBody(req))
    state.profile = {
      ...state.profile,
      ...body,
    }
    json(res, 200, state.profile)
    return true
  }

  if (pathname === '/user/avatar' && req.method === 'POST') {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(state.profile.full_name)}&background=0D8ABC&color=fff`
    state.profile.avatar_url = avatarUrl
    json(res, 200, { avatar_url: avatarUrl })
    return true
  }

  if (pathname === '/user/password' && req.method === 'PUT') {
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/user/requisites' && req.method === 'PUT') {
    const body = parseJsonBody(await readBody(req))
    state.profile = { ...state.profile, ...body }
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/user/documents' && req.method === 'GET') {
    json(res, 200, state.documents)
    return true
  }

  if (pathname === '/user/documents' && req.method === 'POST') {
    const filename = `document-${state.documents.length + 1}.pdf`
    const doc = {
      id: nextId(state, 'doc'),
      filename,
      url: `https://example.com/${filename}`,
      uploaded_at: new Date().toISOString(),
    }
    state.documents.unshift(doc)
    json(res, 200, doc)
    return true
  }

  if (pathname.startsWith('/user/documents/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop()
    state.documents = state.documents.filter((item) => item.id !== id)
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/users' && req.method === 'GET') {
    json(res, 200, state.users)
    return true
  }

  if (pathname.startsWith('/users/') && pathname.endsWith('/role') && req.method === 'PUT') {
    const id = pathname.split('/')[2]
    const body = parseJsonBody(await readBody(req))
    state.users = state.users.map((item) => item.id === id ? { ...item, role: body.role } : item)
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/v1/pvz' && req.method === 'GET') {
    json(res, 200, state.pvz)
    return true
  }

  if (pathname === '/v1/pvz' && req.method === 'POST') {
    const body = parseJsonBody(await readBody(req))
    const pvz = {
      id: nextId(state, 'pvz'),
      address: body.address ?? '',
      name: body.name ?? `ПВЗ ${state.pvz.length + 1}`,
      status: 'active',
      load_percent: 0,
      max_capacity: Number(body.max_capacity ?? 100),
      location_type: body.location_type ?? 'street',
      traffic: 'medium',
      hours: '09:00-21:00',
      marketplace: body.marketplace ?? 'Ozon',
    }
    state.pvz.unshift(pvz)
    state.schedules[pvz.id] = Array.from({ length: 7 }, () => ({ is_day_off: false, start_time: '09:00', end_time: '21:00' }))
    json(res, 200, pvz)
    return true
  }

  if (pathname.match(/^\/v1\/pvz\/[^/]+\/schedule$/) && req.method === 'GET') {
    const id = pathname.split('/')[3]
    json(res, 200, state.schedules[id] ?? Array.from({ length: 7 }, () => ({ is_day_off: false, start_time: '09:00', end_time: '21:00' })))
    return true
  }

  if (pathname.match(/^\/v1\/pvz\/[^/]+\/schedule$/) && req.method === 'PUT') {
    const id = pathname.split('/')[3]
    const body = parseJsonBody(await readBody(req))
    state.schedules[id] = Array.isArray(body) ? body : []
    json(res, 200, { ok: true })
    return true
  }

  if (pathname.match(/^\/v1\/pvz\/[^/]+$/) && req.method === 'PUT') {
    const id = pathname.split('/')[3]
    const body = parseJsonBody(await readBody(req))
    state.pvz = state.pvz.map((item) => item.id === id ? { ...item, ...body } : item)
    json(res, 200, { ok: true })
    return true
  }

  if (pathname.match(/^\/v1\/pvz\/[^/]+$/) && req.method === 'DELETE') {
    const id = pathname.split('/')[3]
    state.pvz = state.pvz.filter((item) => item.id !== id)
    delete state.schedules[id]
    state.ops = state.ops.filter((item) => item.pvz_id !== id)
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/v1/operations' && req.method === 'GET') {
    const pvzId = requestUrl.searchParams.get('pvz_id')
    const opType = requestUrl.searchParams.get('op_type')
    const dateFrom = requestUrl.searchParams.get('date_from')
    const dateTo = requestUrl.searchParams.get('date_to')
    const filtered = state.ops.filter((item) => {
      if (pvzId && item.pvz_id !== pvzId) return false
      if (opType && item.op_type !== opType) return false
      const ts = new Date(item.created_at).getTime()
      if (dateFrom && ts < new Date(dateFrom).getTime()) return false
      if (dateTo && ts > new Date(dateTo).getTime()) return false
      return true
    })
    json(res, 200, filtered)
    return true
  }

  if (pathname === '/v1/operations' && req.method === 'POST') {
    const body = parseJsonBody(await readBody(req))
    const pvz = state.pvz.find((item) => item.id === body.pvz_id)
    const op = {
      id: nextId(state, 'op'),
      pvz_id: body.pvz_id,
      pvz_name: pvz?.name ?? 'ПВЗ',
      op_type: body.op_type ?? 'in',
      quantity: Number(body.quantity ?? 1),
      note: body.note ?? null,
      created_at: new Date().toISOString(),
    }
    state.ops.unshift(op)
    json(res, 200, op)
    return true
  }

  if (pathname.match(/^\/v1\/operations\/[^/]+$/) && req.method === 'DELETE') {
    const id = pathname.split('/')[3]
    state.ops = state.ops.filter((item) => item.id !== id)
    json(res, 200, { ok: true })
    return true
  }

  if (pathname === '/v1/stats' && req.method === 'GET') {
    json(res, 200, computeStats(state))
    return true
  }

  if (pathname === '/v1/finance' && req.method === 'GET') {
    json(res, 200, computeFinance(state))
    return true
  }

  if (pathname === '/v1/marketplace-items' && req.method === 'GET') {
    json(res, 200, state.marketplaceItems)
    return true
  }

  if (pathname === '/marketplace/orders' && req.method === 'GET') {
    json(res, 200, state.orders)
    return true
  }

  if (matches(pathname, '/marketplace') && req.method === 'POST') {
    state.metrics.lastSync = Math.floor(Date.now() / 1000)
    json(res, 200, { ok: true })
    return true
  }

  return false
}

async function handler(req, res) {
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    const requestUrl = new URL(req.url || '/', 'http://localhost')
    const pathname = requestUrl.pathname.replace(/^\/api/, '') || '/'

    if (await handleDemo(req, res, requestUrl, pathname)) {
      return
    }

    json(res, 404, {
      error: 'Demo API route is not implemented.',
      path: pathname,
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
    json(res, 502, {
      error: 'Failed to proxy API request to backend.',
    })
  }
}

module.exports = handler
