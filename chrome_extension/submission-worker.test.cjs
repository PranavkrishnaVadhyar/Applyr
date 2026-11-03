const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
function setup() {
  let listener, updated
  const stored = { session: { refresh_token: 'refresh' } }, calls = []
  const chrome = { runtime: { id: 'ext', getURL: suffix => 'chrome-extension://ext/' + suffix, onMessage: { addListener: fn => { listener = fn } } },
    storage: { session: { get: async key => ({ [key]: stored[key] }), set: async value => Object.assign(stored, value), remove: async key => { delete stored[key] } } },
    scripting: { executeScript: async () => {} },
    tabs: { query: async () => [{ id: 7, url: 'https://jobs.example/apply' }], sendMessage: async () => ({}),
      onUpdated: { addListener: fn => { updated = fn } }, onRemoved: { addListener() {} } } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'submission-worker.js'), 'utf8'), { chrome, URL, Date, crypto: { randomUUID: () => 'nonce' },
    authorizedRequest: async (...args) => { calls.push(args); return { id: '11111111-1111-4111-8111-111111111111', status: 'draft', resume_id: 'resume', company_name: 'Example', job_role: 'Engineer' } } })
  const popup = { id: 'ext', url: 'chrome-extension://ext/popup/popup.html' }
  const page = { id: 'ext', url: 'https://jobs.example/apply', tab: { id: 7 }, frameId: 0 }
  const send = (message, sender = popup) => new Promise(resolve => listener(message, sender, resolve))
  return { stored, calls, page, send, updated, arm: () => send({ action: 'watchSubmission', application_id: '11111111-1111-4111-8111-111111111111' }) }
}
test('detection requires an armed tab, matching token, attempt and explicit success', async () => {
  const s = setup(); await s.arm()
  const success = { action: 'submissionSuccess', token: 'nonce', evidence: 'Your application has been submitted' }
  assert.equal((await s.send(success, s.page)).data.ignored, true)
  await s.send({ action: 'submissionAttempt', token: 'nonce' }, s.page)
  assert.equal((await s.send(success, { ...s.page, tab: { id: 99 } })).data.ignored, true)
  assert.equal((await s.send({ ...success, token: 'wrong' }, s.page)).data.ignored, true)
  assert.equal((await s.send({ ...success, evidence: 'Thank you' }, s.page)).data.ignored, true)
  assert.equal((await s.send({ ...success, evidence: 'If your application has been submitted, wait.' }, s.page)).data.ignored, true)
  assert.equal((await s.send({ ...success, evidence: 'Your application was not submitted' }, s.page)).data.ignored, true)
  assert.equal((await s.send(success, s.page)).data.recorded, true)
  assert.equal(s.calls.filter(call => call[0].includes('confirm-submission')).length, 1)
  assert.equal((await s.send(success, s.page)).data.ignored, true)
})
test('expiry, cross-origin navigation and explicit stop cancel detection', async () => {
  const s = setup(); await s.arm(); s.stored.submissionWatch.expiresAt = 1
  assert.equal((await s.send({ action: 'submissionAttempt', token: 'nonce' }, s.page)).data.ignored, true)
  await s.arm(); await s.updated(7, { status: 'complete' }, { url: 'https://different.example/' })
  assert.equal(s.stored.submissionWatch, undefined)
  await s.arm(); await s.send({ action: 'stopSubmissionWatch' }); assert.equal(s.stored.submissionWatch, undefined)
})
