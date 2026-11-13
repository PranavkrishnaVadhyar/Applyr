const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
test('job extraction sends full rendered text without paragraph filtering or truncation', () => {
  const text = 'Heading\nList item\nTable cell\n'.repeat(3000)
  const context = vm.createContext({ document: { title: 'Test job', body: { innerText: text } },
    window: { location: { href: 'https://example.com/job' } },
    chrome: { runtime: { onMessage: { addListener() {} } } } })
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8'), context)
  assert.equal(context.extractJobDetails().text, text)
  assert.equal(context.extractJobDetails().url, 'https://example.com/job')
})
