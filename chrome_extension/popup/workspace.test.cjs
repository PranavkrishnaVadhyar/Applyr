const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')

test('late recovery from a previous account cannot restore its draft or unlock the new account', async () => {
  const listeners = {}, loads = {}, restored = []
  const node = () => ({ value: '', addEventListener() {}, textContent: '' })
  const nodes = {}
  const context = vm.createContext({
    document: { querySelectorAll: () => [], getElementById: id => nodes[id] ||= node(), addEventListener: (name, fn) => { listeners[name] = fn } },
    draftInputs: [node(), node(), node(), node()], trackingBusy: false,
    trackingControls() {}, selectApplication: snapshot => restored.push(snapshot),
    request: ({ owner }) => new Promise(resolve => { loads[owner] = resolve }),
  })
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'workspace.js'), 'utf8'), context)
  const first = listeners.applyrSession({ detail: { signedIn: true, userId: 'first' } })
  const second = listeners.applyrSession({ detail: { signedIn: true, userId: 'second' } })
  loads.first({ job_role: 'Private old draft' }); await first
  assert.equal(restored.length, 0)
  assert.equal(context.trackingBusy, true)
  loads.second(null); await second
  assert.equal(context.trackingBusy, false)
})
