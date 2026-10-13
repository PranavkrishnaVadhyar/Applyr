const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')

function setup(fetch) {
  let listener
  const stored = {}
  const chrome = {
    runtime: { id: 'extension-id', getURL: suffix => 'chrome-extension://extension-id/' + suffix,
      onMessage: { addListener: callback => { listener = callback } } },
    storage: { session: {
      get: async key => ({ [key]: stored[key] }),
      set: async values => Object.assign(stored, values),
      remove: async key => { delete stored[key] },
    } },
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8'), { chrome, fetch })
  const sender = { id: 'extension-id', url: 'chrome-extension://extension-id/popup/popup.html' }
  return { stored, listener, sender, send: message => new Promise(resolve => listener(message, sender, resolve)) }
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })

test('page content scripts cannot call authenticated extension operations', () => {
  const { listener } = setup(() => { throw new Error('must not fetch') })
  assert.equal(listener({ action: 'saveJob' }, { id: 'extension-id', url: 'https://jobs.example.com' }, () => assert.fail()), undefined)
})

test('sign-in stores session only; extraction sends bearer without user id', async () => {
  const { send, stored } = setup(async (url, options) => {
    if (url.endsWith('/signin')) return json({ access_token: 'access', refresh_token: 'refresh' })
    assert.equal(options.headers.Authorization, 'Bearer access')
    assert.deepEqual(JSON.parse(options.body), { text: 'Job description' })
    return json({ status: 'draft' })
  })
  await send({ action: 'signin', email: 'user@example.com', password: 'secret' })
  assert.equal(stored.session.access_token, 'access')
  assert.equal(stored.session.password, undefined)
  const result = await send({ action: 'saveJob', text: 'Job description' })
  assert.equal(result.data.status, 'draft')
})

test('expired extension session refreshes and retries with rotated token', async () => {
  const { send, stored } = setup(async (url, options) => {
    if (url.endsWith('/refresh')) return json({ access_token: 'new', refresh_token: 'rotated' })
    return options.headers.Authorization === 'Bearer new' ? json({ status: 'draft' }) : json({ detail: 'Expired' }, 401)
  })
  stored.session = { access_token: 'old', refresh_token: 'refresh' }
  const result = await send({ action: 'saveJob', text: 'job' })
  assert.equal(result.data.status, 'draft')
  assert.equal(stored.session.refresh_token, 'rotated')
})

test('HTTP failure is not reported as a saved application', async () => {
  const { send, stored } = setup(async () => json({ detail: 'Extraction failed' }, 500))
  stored.session = { access_token: 'access', refresh_token: 'refresh' }
  const result = await send({ action: 'saveJob', text: 'job' })
  assert.equal(result.error, 'Extraction failed')
  assert.equal(result.data, undefined)
})

test('failed remote logout still removes local extension session', async () => {
  const { send, stored } = setup(async () => json({ detail: 'Unavailable' }, 503))
  stored.session = { access_token: 'access', refresh_token: 'refresh' }
  await send({ action: 'logout' })
  assert.equal(stored.session, undefined)
})
