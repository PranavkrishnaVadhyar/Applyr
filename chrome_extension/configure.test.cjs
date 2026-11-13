const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const { configure } = require('./configure.cjs')

test('configuration accepts inline comments and keeps runtime URL and permission aligned', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'applyr-config-'))
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ host_permissions: [], permissions: ['activeTab'] }))
  for (const value of [
    'https://applyr-backend.vercel.app   # http://localhost:8000',
    '"https://applyr-backend.vercel.app/" # hosted',
    "'https://applyr-backend.vercel.app'",
  ]) {
    fs.writeFileSync(path.join(directory, '.env'), `API_BASE_URL=${value}\n`)
    assert.equal(configure(directory, {}), 'https://applyr-backend.vercel.app')
    const context = vm.createContext({})
    vm.runInContext(fs.readFileSync(path.join(directory, 'config.js'), 'utf8'), context)
    assert.equal(context.APPLYR_API_URL, 'https://applyr-backend.vercel.app')
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json')))
    assert.deepEqual(manifest.host_permissions, ['https://applyr-backend.vercel.app/*'])
    assert.deepEqual(manifest.permissions, ['activeTab'])
  }
  assert.equal(configure(directory, { API_BASE_URL: 'http://localhost:8000' }), 'http://localhost:8000')
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'))).host_permissions, ['http://localhost/*'])
  for (const filename of ['.env', 'manifest.json', 'config.js']) fs.unlinkSync(path.join(directory, filename))
  fs.rmdirSync(directory)
})
