const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function setup(fetch) {
  const values = new Map([['authToken', 'old-access'], ['refreshToken', 'old-refresh']])
  const localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  const context = vm.createContext({ exports: {}, process: { env: {} }, localStorage,
    window: new EventTarget(), navigator: {}, Headers, FormData, Event, fetch })
  const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/api-client.ts'), 'utf8')
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return { ...context.exports, localStorage }
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })

test('HTTP status and validation detail survive error handling', async () => {
  const { apiClient, ApiError } = setup(async () => json({ detail: [{ msg: 'Invalid email' }] }, 422))
  await assert.rejects(apiClient.post('/api/auth/signup', {}), error => error instanceof ApiError && error.status === 422 && error.message === 'Invalid email')
})

test('concurrent expired requests share one refresh and retry with new bearer', async () => {
  let refreshes = 0
  const { apiClient, localStorage } = setup(async (url, options) => {
    if (url.endsWith('/refresh')) {
      refreshes++
      await new Promise(resolve => setTimeout(resolve, 10))
      return json({ access_token: 'new-access', refresh_token: 'new-refresh' })
    }
    return options.headers.get('Authorization') === 'Bearer new-access' ? json({ ok: true }) : json({ detail: 'Expired' }, 401)
  })
  const results = await Promise.all([apiClient.get('/one'), apiClient.get('/two')])
  assert.equal(refreshes, 1)
  assert.ok(results.every(result => result.ok))
  assert.equal(localStorage.getItem('refreshToken'), 'new-refresh')
})

test('invalid refresh clears session and returns 401', async () => {
  const { apiClient, localStorage } = setup(async () => json({ detail: 'Expired' }, 401))
  await assert.rejects(apiClient.get('/private'), error => error.status === 401)
  assert.equal(localStorage.getItem('authToken'), null)
})

test('temporary refresh failure preserves session', async () => {
  const { apiClient, localStorage } = setup(async url => json({ detail: 'Unavailable' }, url.endsWith('/refresh') ? 503 : 401))
  await assert.rejects(apiClient.get('/private'), error => error.status === 503)
  assert.equal(localStorage.getItem('refreshToken'), 'old-refresh')
})

test('failed sign-in does not attempt refresh or send old bearer', async () => {
  let calls = 0
  const { apiClient } = setup(async (url, options) => {
    calls++
    assert.equal(options.headers.has('Authorization'), false)
    return json({ detail: 'Invalid credentials' }, 401)
  })
  await assert.rejects(apiClient.post('/api/auth/signin', {}), error => error.status === 401)
  assert.equal(calls, 1)
})

test('multipart upload retains browser-generated content type', async () => {
  const { apiClient } = setup(async (url, options) => {
    assert.equal(options.headers.has('Content-Type'), false)
    assert.equal(options.headers.get('Authorization'), 'Bearer old-access')
    return json({ ok: true })
  })
  await apiClient.request('/api/resumes/', { method: 'POST', body: new FormData() })
})

test('logout during refresh cannot restore the session', async () => {
  let release, started
  const ready = new Promise(resolve => { started = resolve })
  const waiting = new Promise(resolve => { release = resolve })
  const { apiClient, clearSession, localStorage } = setup(async url => {
    if (url.endsWith('/refresh')) {
      started()
      await waiting
      return json({ access_token: 'new-access', refresh_token: 'new-refresh' })
    }
    return json({ detail: 'Expired' }, 401)
  })
  const request = apiClient.get('/private')
  await ready
  clearSession()
  release()
  await assert.rejects(request, error => error.status === 401)
  assert.equal(localStorage.getItem('authToken'), null)
})
