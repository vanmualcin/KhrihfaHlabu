import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildLibrary, indexIntegrityErrors, readJson, root, serialize, sortCatalog, validators } from '../scripts/lib.mjs'

const examplePath = path.join(root, 'hymns/example-hymn.json')

test('valid hymn and library documents pass their schemas', async () => {
  const validate = await validators()
  assert.equal(validate.hymn(await readJson(examplePath)), true)
  assert.equal(validate.library(await readJson(path.join(root, 'index.json'))), true)
})

test('malformed JSON reports its file', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'khrihfahlabu-'))
  const file = path.join(directory, 'broken.json')
  await writeFile(file, '{')
  await assert.rejects(readJson(file), /broken\.json: invalid JSON/)
  await rm(directory, { recursive: true })
})

test('invalid hymn structure and executable URL schemes fail schema validation', async () => {
  const validate = await validators()
  const hymn = await readJson(examplePath)
  assert.equal(validate.hymn({ ...hymn, parts: [] }), false)
  const library = await readJson(path.join(root, 'index.json'))
  library.hymns[0].url = 'javascript:alert(1)'
  assert.equal(validate.library(library), false)
})

test('duplicate IDs and URLs are detected', () => {
  const entry = { id: 'same', url: './hymns/a.json' }
  const errors = indexIntegrityErrors({ hymns: [entry, entry] }, ['/tmp/a.json'])
  assert(errors.some((error) => error.includes('duplicate hymn id')))
  assert(errors.some((error) => error.includes('duplicate hymn URL')))
})

test('missing targets and orphaned files are detected', () => {
  const missing = indexIntegrityErrors({ hymns: [{ id: 'missing', url: './hymns/missing.json' }] }, [])
  assert(missing.some((error) => error.includes('missing target')))
  const orphan = indexIntegrityErrors({ hymns: [] }, ['/tmp/orphan.json'])
  assert(orphan.some((error) => error.includes('orphaned hymn file')))
})

test('catalog sorting is deterministic by number, title, then id', () => {
  const input = [
    { id: 'z', title: 'Zulu' },
    { id: 'b', title: 'Beta', number: 2 },
    { id: 'a', title: 'Alpha', number: 2 },
    { id: 'c', title: 'Gamma', number: 1 }
  ]
  assert.deepEqual(sortCatalog(input).map(({ id }) => id), ['c', 'a', 'b', 'z'])
})

test('generated index matches the committed index exactly', async () => {
  assert.equal(serialize(await buildLibrary()), serialize(await readJson(path.join(root, 'index.json'))))
  assert.notEqual(serialize({ ...(await buildLibrary()), name: 'Mismatch' }), serialize(await readJson(path.join(root, 'index.json'))))
})
