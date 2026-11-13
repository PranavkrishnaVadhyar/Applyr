const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

class Node {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.listeners = {}; this.value = ''; this.checked = false; this.classList = { toggle() {} } }
  append(...children) { this.children.push(...children) }
  replaceChildren() { this.children = [] }
  setAttribute() {}
  addEventListener(name, fn) { this.listeners[name] = fn }
  async fire(name, event = {}) { return this.listeners[name]?.(event) }
  dispatchEvent(event) { this.listeners[event.type]?.(event) }
}
test('review is opt-in, editing revokes confirmation, and only reviewed answers are sent', async () => {
  const nodes = Object.fromEntries(['autofillPanel', 'resumeSelect', 'answerReview', 'scanBtn', 'applyBtn', 'reloadResumes', 'enableDrafts', 'generateBtn'].map(id => [id, new Node()]))
  const document = new Node()
  document.getElementById = id => nodes[id]
  document.createElement = tag => new Node(tag)
  document.createTextNode = text => text
  const messages = []
  let saveCalls = 0
  const chrome = {
    tabs: { query: async () => [{ id: 1, url: 'https://example.com/apply' }], sendMessage: async (_id, message) => {
      messages.push(message)
      return message.action === 'scanForm' ? { scan_id: 'scan', url: 'https://example.com/apply', fields: [{ id: '0', label: 'Email', type: 'email' }] } : { filled: 1, skipped: 0 }
    } }, scripting: { executeScript: async () => {} },
  }
  const request = async message => message.action === 'listResumes' ? [{ id: 'resume', filename: 'Test.pdf' }]
    : { results: [{ field_id: '0', value: 'test@example.com', reason: 'Saved fact', evidence: [{ id: 'contact:email', text: 'test@example.com' }] }] }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'autofill.js'), 'utf8'), { document, chrome, request, CustomEvent, showStatus() {},
    saveCurrentDraft: async () => { saveCalls++; throw new Error('Save failed') } })
  await document.fire('applyrSession', { detail: { signedIn: true } })
  await new Promise(setImmediate)
  nodes.resumeSelect.value = 'resume'
  await nodes.scanBtn.fire('click')
  assert.equal(messages.filter(item => item.action === 'applyAnswers').length, 0)
  await nodes.generateBtn.fire('click')
  assert.equal(nodes.applyBtn.disabled, true)
  const card = nodes.answerReview.children[0]
  const input = card.children.find(child => child.tag === 'textarea')
  const checkbox = card.children.find(child => child.tag === 'label').children[0]
  assert.equal(checkbox.checked, false)
  checkbox.checked = true; await checkbox.fire('change')
  assert.equal(nodes.applyBtn.disabled, false)
  input.value = 'corrected@example.com'; await input.fire('input')
  assert.equal(checkbox.checked, false); assert.equal(nodes.applyBtn.disabled, true)
  checkbox.checked = true; await checkbox.fire('change')
  await nodes.applyBtn.fire('click')
  assert.equal(messages.filter(item => item.action === 'applyAnswers').length, 1)
  assert.equal(saveCalls, 0, 'webpage filling must not depend on backend saving')
  assert.equal(input.value, 'corrected@example.com')
  assert.equal(nodes.answerReview.children.length, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1).answers)), [{ field_id: '0', value: 'corrected@example.com' }])
  assert.equal(nodes.applyBtn.disabled, true)
  assert.equal(nodes.answerReview.children.length, 1, 'keep answer text after filling')
})
