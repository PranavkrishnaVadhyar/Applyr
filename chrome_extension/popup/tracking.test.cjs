const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

class Node {
  constructor() { this.children = []; this.value = ''; this.listeners = {}; this.disabled = false }
  append(child) { this.children.push(child) }
  replaceChildren() { this.children = [] }
  addEventListener(name, fn) { this.listeners[name] = fn }
  async fire(name, event = {}) { return this.listeners[name]?.(event) }
}
function setup() {
  const ids = ['savedApplication', 'saveDraftBtn', 'confirmSubmissionBtn', 'draftState', 'draftRole', 'draftCompany', 'draftUrl', 'draftDescription', 'resumeSelect', 'scanBtn', 'extractBtn', 'refreshApplications']
  const nodes = Object.fromEntries(ids.map(id => [id, new Node()]))
  nodes.resumeSelect.value = 'resume-id'
  const document = new Node(); document.getElementById = id => nodes[id]; document.createElement = () => new Node()
  const calls = [], apps = [], errors = []
  let failSave = false
  const context = vm.createContext({ document, crypto: { randomUUID },
    activeScan: { url: 'https://example.com/apply' },
    reviewedAnswers: [
      { label: 'Email', field_type: 'email', input: { value: 'reviewed@example.com' }, select: { checked: true } },
      { label: 'Name', field_type: 'text', input: { value: 'Unreviewed' }, select: { checked: false } },
    ], clearReview() {}, showStatus: message => errors.push(message),
    chrome: { tabs: { query: async () => [{ url: 'https://example.com/job' }] } },
    request: async message => {
      calls.push(JSON.parse(JSON.stringify(message)))
      if (message.action === 'listApplications') return apps
      if (message.action === 'saveApplicationDraft') {
        if (failSave) throw new Error('Save failed')
        const app = { id: message.application_id, ...message.draft, status: 'draft',
          response: { version: 1, job_url: message.draft.job_url, answers: message.draft.answers } }
        apps.splice(0, apps.length, app); return app
      }
      apps[0].status = 'applied'; apps[0].applied_at = '2026-10-21T12:00:00Z'; return apps[0]
    },
  })
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'tracking.js'), 'utf8'), context)
  return { nodes, document, context, calls, apps, errors, fail: () => { failSave = true } }
}
test('save includes only reviewed answers and explicit confirmation records submission', async () => {
  const s = setup()
  await s.document.fire('applyrSession', { detail: { signedIn: true } }); await new Promise(setImmediate)
  s.nodes.draftRole.value = 'Engineer'; s.nodes.draftCompany.value = 'Example'
  await s.nodes.saveDraftBtn.fire('click')
  const saved = s.calls.find(call => call.action === 'saveApplicationDraft')
  assert.equal(saved.draft.answers.length, 1)
  assert.equal(saved.draft.answers[0].value, 'reviewed@example.com')
  assert.equal(s.nodes.confirmSubmissionBtn.disabled, false)
  assert.equal(s.calls.filter(call => call.action === 'confirmSubmission').length, 0)
  await s.nodes.confirmSubmissionBtn.fire('click')
  assert.equal(s.apps[0].status, 'applied'); assert.equal(s.nodes.saveDraftBtn.disabled, true)
  await s.nodes.confirmSubmissionBtn.fire('click')
  assert.equal(s.calls.filter(call => call.action === 'confirmSubmission').length, 1)
})
test('failed save stays retryable with stable ID and cannot enable confirmation', async () => {
  const s = setup(); s.fail()
  await s.document.fire('applyrSession', { detail: { signedIn: true } }); await new Promise(setImmediate)
  s.nodes.draftRole.value = 'Engineer'; s.nodes.draftCompany.value = 'Example'
  await s.nodes.saveDraftBtn.fire('click'); await s.nodes.saveDraftBtn.fire('click')
  const saves = s.calls.filter(call => call.action === 'saveApplicationDraft')
  assert.equal(saves.length, 2); assert.equal(saves[0].application_id, saves[1].application_id)
  assert.equal(s.nodes.confirmSubmissionBtn.disabled, true)
  assert.ok(s.errors.includes('Save failed'))
})
test('sign-out during draft preparation prevents saving into a changed session', async () => {
  const s = setup()
  await s.document.fire('applyrSession', { detail: { signedIn: true } }); await new Promise(setImmediate)
  s.nodes.draftRole.value = 'Engineer'; s.nodes.draftCompany.value = 'Example'
  s.context.chrome.tabs.query = async () => {
    await s.document.fire('applyrSession', { detail: { signedIn: false } })
    return [{ url: 'https://example.com/job' }]
  }
  await s.nodes.saveDraftBtn.fire('click')
  assert.equal(s.calls.filter(call => call.action === 'saveApplicationDraft').length, 0)
  assert.equal(s.nodes.confirmSubmissionBtn.disabled, true)
})
test('reopened drafts restore answers only to matching page and labels; edits require saving again', async () => {
  const s = setup()
  await s.document.fire('applyrSession', { detail: { signedIn: true } }); await new Promise(setImmediate)
  s.nodes.draftRole.value = 'Engineer'; s.nodes.draftCompany.value = 'Example'
  await s.nodes.saveDraftBtn.fire('click')
  s.nodes.savedApplication.value = s.apps[0].id; await s.nodes.savedApplication.fire('change')
  assert.equal(vm.runInContext("savedAnswerFor({label:'Email', type:'email'}, 'https://example.com/apply')", s.context), 'reviewed@example.com')
  assert.equal(vm.runInContext("savedAnswerFor({label:'Email', type:'email'}, 'https://another.example/apply')", s.context), undefined)
  await s.document.fire('applyrAnswersChanged')
  assert.equal(s.nodes.confirmSubmissionBtn.disabled, true)
  s.context.reviewedAnswers[0].select.checked = false
  await s.nodes.saveDraftBtn.fire('click')
  assert.equal(s.apps[0].response.answers.length, 0)
  await s.document.fire('applyrSession', { detail: { signedIn: false } })
  assert.equal(vm.runInContext('retainedAnswers.length', s.context), 0)
})
