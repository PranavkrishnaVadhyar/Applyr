const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')

test('guided flow gates scanning, separates fill/save, and advances after filling', () => {
  const listeners = {}, nodes = {}, clicks = []
  let view = 'job'
  const node = id => nodes[id] ||= { hidden: false, disabled: false, value: '', options: [],
    addEventListener: (name, fn) => { listeners[id + ':' + name] = fn },
    click: () => clicks.push(id), focus() {}, setAttribute() {}, textContent: '' }
  const context = vm.createContext({
    document: { getElementById: node, querySelector: () => ({ dataset: { view } }),
      addEventListener: (name, fn) => { listeners[name] = fn } },
    resumeSelect: node('resumeSelect'), scanBtn: node('scanBtn'), applyBtn: node('applyBtn'), saveDraftBtn: node('saveDraftBtn'),
    trackingBusy: false, scanning: false, draftInputs: [{ value: 'Engineer' }, { value: 'Example' }],
    selectView: next => { view = next; listeners.applyrViewChanged() },
  })
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'flow.js'), 'utf8'), context)
  assert.equal(nodes.goReview.disabled, true)
  assert.equal(nodes.applyBtn.hidden, true)
  assert.equal(nodes.saveDraftBtn.hidden, false)
  listeners.applyrSession({ detail: { signedIn: true } })
  nodes.resumeSelect.value = 'resume'; nodes.resumeSelect.options = [{}]
  listeners.applyrResumesLoaded()
  assert.equal(nodes.goReview.disabled, false)
  view = 'review'; listeners.applyrViewChanged(); listeners['goReview:click']()
  assert.deepEqual(clicks, ['scanBtn'])
  assert.equal(nodes.applyBtn.hidden, false)
  assert.equal(nodes.saveDraftBtn.hidden, false)
  context.scanning = true; context.renderFlow()
  assert.equal(nodes.goReview.disabled, true)
  listeners['goReview:click'](); assert.equal(clicks.length, 1)
  listeners.applyrFilled({ detail: { filled: 2, skipped: 1 } })
  assert.equal(view, 'activity')
  assert.match(nodes.fillOutcome.textContent, /2 fields filled · 1 skipped/)
  assert.equal(nodes.applyBtn.hidden, true)
  assert.equal(nodes.saveDraftBtn.hidden, false)
  listeners['reviewAgain:click']()
  assert.equal(view, 'review')
  listeners.applyrSession({ detail: { signedIn: true } })
  assert.equal(view, 'review', 'session refresh must preserve the current step')
  listeners.applyrSession({ detail: { signedIn: false } })
  assert.equal(view, 'job')
})
