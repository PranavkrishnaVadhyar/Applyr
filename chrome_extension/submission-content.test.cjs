const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
test('detector ignores preexisting success and synthetic submits; detects fresh visible confirmation', async () => {
  let listener, mutate, text = 'Your application has been submitted'
  const listeners = {}
  const calls = []
  const context = { document: { documentElement: {}, querySelectorAll: () => [{ textContent: text, getClientRects: () => [{}] }],
    addEventListener: (name, fn) => { listeners[name] = fn } }, getComputedStyle: () => ({ visibility: 'visible' }),
    MutationObserver: class { constructor(fn) { mutate = fn } observe() {} }, setTimeout: fn => fn(), Date,
    chrome: { runtime: { id: 'ext', onMessage: { addListener: fn => { listener = fn } }, sendMessage: async message => {
      calls.push(message); return { data: message.action === 'submissionAttempt' ? { accepted: true } : { recorded: true } }
    } } } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'submission-content.js'), 'utf8'), context)
  listener({ action: 'armSubmissionDetector', token: 'nonce', attemptedAt: 0 }, { id: 'ext' }, () => {})
  mutate(); await listeners.submit({ isTrusted: false }); assert.equal(calls.length, 0)
  await listeners.submit({ isTrusted: true }); assert.equal(calls.length, 0)
  listeners.keydown({ isTrusted: true, key: 'Enter' })
  text = ''; await listeners.submit({ isTrusted: true }); assert.equal(calls.length, 1)
  text = 'Your application has not been submitted'; mutate(); assert.equal(calls.length, 1)
  text = 'Your application has been received'; mutate(); await new Promise(setImmediate)
  assert.equal(calls[1].action, 'submissionSuccess')
})
