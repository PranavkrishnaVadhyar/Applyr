const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function setup(apiClient = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/resumes-api.ts'), 'utf8')
  const context = vm.createContext({ exports: {}, FormData, Error, require: () => ({ apiClient }) })
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return context.exports
}

test('file validation accepts supported extensions through exactly 10 MB', () => {
  const { validateResumeFile, MAX_RESUME_BYTES } = setup()
  assert.equal(MAX_RESUME_BYTES, 10 * 1024 * 1024)
  for (const name of ['resume.pdf', 'resume.DOC', 'resume.docx']) {
    assert.equal(validateResumeFile({ name, size: MAX_RESUME_BYTES }), null)
  }
  assert.match(validateResumeFile({ name: 'resume.pdf', size: MAX_RESUME_BYTES + 1 }), /10 MB/)
  assert.match(validateResumeFile({ name: 'resume.pdf', size: 0 }), /empty/)
  assert.match(validateResumeFile({ name: 'resume.exe', size: 1 }), /supported/)
})

test('upload sends original filename in multipart form and returns server resume', async () => {
  const result = { message: 'ok', data: { resume: { filename: 'Original Resume.pdf', resume_content: [] }, content: {} } }
  const { resumesApi } = setup({ request: async (endpoint, options) => {
    assert.equal(endpoint, '/api/resumes/')
    assert.equal(options.method, 'POST')
    assert.ok(options.body instanceof FormData)
    assert.equal(options.body.get('file').name, 'Original Resume.pdf')
    return result
  } })
  assert.equal(await resumesApi.uploadResume(new File(['pdf'], 'Original Resume.pdf')), result)
})

test('invalid uploads are rejected before making an API request', async () => {
  const { resumesApi } = setup({ request: () => assert.fail('Must not call API') })
  await assert.rejects(resumesApi.uploadResume(new File([], 'resume.pdf')), /empty/)
})

test('list, update, delete and private download use matching backend routes', async () => {
  const calls = []
  const { resumesApi } = setup(Object.fromEntries(['get', 'put', 'delete'].map(method => [method, async (...args) => { calls.push([method, ...args]); return {} }])))
  await resumesApi.getUserResumes()
  await resumesApi.getResume('id')
  await resumesApi.updateResume('id', { skills: ['Python'] })
  await resumesApi.getDownloadUrl('id')
  await resumesApi.deleteResume('id')
  assert.deepEqual(calls, [
    ['get', '/api/resumes/'], ['get', '/api/resumes/id'],
    ['put', '/api/resumes/id', { skills: ['Python'] }],
    ['get', '/api/resumes/id/download'], ['delete', '/api/resumes/id'],
  ])
})

test('server errors reach callers for visible list, edit and delete feedback', async () => {
  const failure = new Error('Storage deletion failed; please retry')
  const { resumesApi } = setup({ delete: async () => { throw failure } })
  await assert.rejects(resumesApi.deleteResume('id'), error => error === failure)
})
