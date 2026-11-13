const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')

function setup() {
  let listener
  class Element {
    constructor(label, type = 'text') {
      this.label = label; this.type = type; this.tagName = 'INPUT'; this._value = ''; this.isConnected = true
      this.maxLength = -1; this.validity = { valid: true }; this.events = []; this.options = []
    }
    get value() { return this._value }
    set value(value) { this._value = value }
    get labels() { return [{ textContent: this.label }] }
    getAttribute() { return null }
    getClientRects() { return this.hidden ? [] : [{}] }
    matches() { return !!this.disabled }
    closest() { return null }
    dispatchEvent(event) { this.events.push(event.type) }
  }
  const elements = [new Element('Email', 'email'), new Element('Full name'), new Element('Password', 'password')]
  const location = { href: 'https://example.com/apply' }
  const context = { chrome: { runtime: { id: 'extension', onMessage: { addListener: fn => { listener = fn } } } },
    document: { querySelectorAll: () => elements, getElementById: () => null }, location,
    crypto: { randomUUID: () => 'scan-id' }, getComputedStyle: () => ({ visibility: 'visible' }),
    HTMLInputElement: Element, HTMLSelectElement: Element, HTMLTextAreaElement: Element, Event }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'autofill-content.js'), 'utf8'), context)
  const send = message => { let result; listener(message, { id: 'extension' }, value => { result = value }); return result }
  return { elements, location, send, document: context.document, Element, scan: () => send({ action: 'scanForm' }), apply: answers => send({ action: 'applyAnswers', scan_id: 'scan-id', answers }) }
}
test('scan excludes unsupported fields and applies using native events without submission', () => {
  const s = setup(); const scan = s.scan(); assert.equal(scan.fields.length, 2)
  assert.equal(s.apply([{ field_id: '0', value: 'test@example.com' }]).filled, 1)
  assert.equal(s.elements[0].value, 'test@example.com')
  assert.deepEqual(s.elements[0].events, ['input', 'change'])
  assert.ok(s.apply([]).error)
})
test('preserves values entered after scan and rejects changed fields', () => {
  const s = setup(); s.scan(); s.elements[0].value = 'user@example.com'; s.elements[1].label = 'Different question'
  assert.equal(s.apply([{ field_id: '0', value: 'overwrite' }, { field_id: '1', value: 'Name' }]).skipped, 2)
  assert.equal(s.elements[0].value, 'user@example.com'); assert.equal(s.elements[1].value, '')
})

test('fill results explain why an existing answer was not overwritten', () => {
  const s = setup(); s.scan(); s.elements[0].value = 'already@example.com'
  const result = s.apply([{ field_id: '0', value: 'new@example.com' }, { field_id: '1', value: 'Test Candidate' }])
  assert.equal(result.filled, 1)
  assert.equal(result.skipped, 1)
  assert.match(result.results[0].reason, /existing value was preserved/)
  assert.equal(result.results[1].status, 'filled')
  assert.equal(s.elements[1].value, 'Test Candidate')
})

test('reads adjacent unassociated labels but does not borrow another field label', () => {
  const s = setup()
  s.elements[0].label = ''
  s.elements[0].previousElementSibling = { tagName: 'LABEL', textContent: 'Email address', getAttribute: () => null }
  assert.equal(s.scan().fields[0].label, 'Email address')
  s.elements[0].previousElementSibling.getAttribute = () => 'another-input'
  assert.equal(s.scan().fields.some(field => field.label === 'Email address'), false)
})
test('navigation, hidden fields and arbitrary field IDs cannot receive answers', () => {
  const s = setup(); s.scan(); s.location.href += '/changed'; assert.ok(s.apply([]).error)
  s.scan(); s.elements[0].hidden = true
  assert.equal(s.apply([{ field_id: '0', value: 'x' }, { field_id: '#password', value: 'x' }]).skipped, 2)
})
test('select fills only a unique current option and preserves existing selection', () => {
  const s = setup(); const e = s.elements[0]; e.type = 'select-one'; e.tagName = 'SELECT'
  e.options = [{ text: 'Pune', value: 'pune' }, { text: 'Delhi', value: 'delhi' }]
  s.scan(); assert.equal(s.apply([{ field_id: '0', value: 'Pune' }]).filled, 1); assert.equal(e.value, 'pune')
  s.scan(); assert.equal(s.apply([{ field_id: '0', value: 'Delhi' }]).skipped, 1)
})
test('invalid or too-long values are not applied', () => {
  const s = setup(); s.elements[0].validity.valid = false; s.elements[1].maxLength = 2; s.scan()
  assert.equal(s.apply([{ field_id: '0', value: 'bad email' }, { field_id: '1', value: 'Too long' }]).skipped, 2)
  assert.equal(s.elements[0].value, ''); assert.deepEqual(s.elements[0].events, [])
})

test('radio groups use the question label, preserve selections and reject changed options', () => {
  const s = setup()
  const group = { querySelector: () => ({ textContent: 'Location' }) }
  const radios = ['Pune', 'Delhi'].map(text => {
    const e = new s.Element(text, 'radio'); e.name = 'location'; e.form = null; e.checked = false
    e.closest = selector => selector.includes('fieldset') ? group : null
    e.click = () => { radios.forEach(item => { item.checked = item === e }) }
    return e
  })
  s.elements.push(...radios)
  const scan = s.scan(); assert.equal(scan.fields.length, 3); assert.equal(scan.fields[2].label, 'Location')
  assert.equal(s.apply([{ field_id: '2', value: 'Pune' }]).filled, 1)
  assert.equal(radios[0].checked, true)
  s.scan(); assert.equal(s.apply([{ field_id: '2', value: 'Delhi' }]).skipped, 1)
  radios[0].checked = false; s.scan(); radios[1].label = 'Mumbai'
  assert.equal(s.apply([{ field_id: '2', value: 'Pune' }]).skipped, 1)
})

test('ARIA combobox clicks only a unique visible associated option', () => {
  const s = setup(), e = new s.Element('Location'); e.getAttribute = key => ({ role: 'combobox', 'aria-controls': 'cities' })[key] || null
  const choices = ['Pune', 'Delhi'].map(text => {
    const option = new s.Element(text); option.textContent = text
    option.getAttribute = key => key === 'aria-selected' && e.value === text ? 'true' : null
    option.click = () => { e.value = text }; return option
  })
  s.document.getElementById = () => ({ getAttribute: () => 'listbox', querySelectorAll: () => choices })
  s.elements.push(e); s.scan()
  assert.equal(s.apply([{ field_id: '2', value: 'Delhi' }]).filled, 1)
  e.value = ''; s.scan(); choices[0].hidden = true
  assert.equal(s.apply([{ field_id: '2', value: 'Delhi' }]).skipped, 1)
})

test('open shadow roots and same-origin frames are scanned; detached frame roots are rejected', () => {
  const s = setup()
  const child = new s.Element('Email', 'email')
  const frame = new s.Element('Frame'); frame.tagName = 'IFRAME'; frame.type = 'frame'
  frame.contentDocument = { querySelectorAll: () => [child] }
  s.elements.push(frame)
  assert.equal(s.scan().fields.length, 3)
  frame.contentDocument = null
  assert.equal(s.apply([{ field_id: '2', value: 'test@example.com' }]).skipped, 1)
  frame.shadowRoot = { querySelectorAll: () => [child] }
  assert.equal(s.scan().fields.length, 3)
  assert.equal(s.apply([{ field_id: '2', value: 'test@example.com' }]).filled, 1)
})
