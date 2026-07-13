import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildCatalog, buildLibrary, hymnFiles, indexIntegrityErrors, publicBaseUrl, readJson, renderLandingPage, root, serialize, sortCatalog, tonicStudioImportBaseUrl, tonicStudioIndexImportUrl, validators } from '../scripts/lib.mjs'

const examplePath = async () => (await hymnFiles())[0]

test('valid hymn and library documents pass their schemas', async () => {
  const validate = await validators()
  assert.equal(validate.hymn(await readJson(await examplePath())), true)
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
  const hymn = await readJson(await examplePath())
  assert.equal(validate.hymn({ ...hymn, parts: [] }), false)
  const library = await readJson(path.join(root, 'index.json'))
  library[0] = 'javascript:alert(1)'
  assert.equal(validate.library(library), false)
})

test('hymns require a valid UUID', async () => {
  const validate = await validators()
  const hymn = await readJson(await examplePath())
  assert.equal(validate.hymn({ ...hymn, uuid: 'not-a-uuid' }), false)
  const { uuid: _uuid, ...withoutUuid } = hymn
  assert.equal(validate.hymn(withoutUuid), false)
})

test('duplicate URLs are detected', () => {
  const url = 'https://khrihfahlabu.mualcin.com/hymns/a.json'
  const errors = indexIntegrityErrors([url, url], ['/tmp/a.json'])
  assert(errors.some((error) => error.includes('duplicate hymn URL')))
})

test('missing targets and orphaned files are detected', () => {
  const missing = indexIntegrityErrors(['https://khrihfahlabu.mualcin.com/hymns/missing.json'], [])
  assert(missing.some((error) => error.includes('missing target')))
  const orphan = indexIntegrityErrors([], ['/tmp/orphan.json'])
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

test('landing page is generated from escaped hymn metadata', async () => {
  const html = renderLandingPage([
    {
      id: 'example-hymn',
      title: 'Example <script> Hymn',
      composer: 'A & B',
      key: 'C',
      language: 'Hakha',
      number: 1,
    }
  ])
  assert.match(html, /Example &lt;script&gt; Hymn/)
  assert(html.includes(`href="${tonicStudioImportBaseUrl}${publicBaseUrl}/hymns/example-hymn.json"`))
  assert(html.includes(`href="${tonicStudioIndexImportUrl}"`))
  assert.match(html, />Import all hymns in Tonic Studio<\/a>/)
  assert.match(html, /<th scope="col">Doh<\/th>/)
  assert.equal(html.includes('<script>'), false)
})
