import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const hymnDirectory = path.join(root, 'hymns')
export const indexPath = path.join(root, 'index.json')
export const landingPath = path.join(root, 'index.html')
export const publicBaseUrl = 'https://khrihfahlabu.mualcin.com'
export const tonicStudioImportBaseUrl = 'https://tonicstudio.mualcin.com?import='
export const libraryIndexUrl = `${publicBaseUrl}/index.json`
export const tonicStudioIndexImportUrl = `https://tonicstudio.mualcin.com?import_by_index=${libraryIndexUrl}`
const kebabPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function readJson(file) {
  let source
  try {
    source = await readFile(file, 'utf8')
  } catch (error) {
    throw new Error(`${path.relative(root, file)}: ${error.message}`)
  }
  try {
    return JSON.parse(source)
  } catch (error) {
    throw new Error(`${path.relative(root, file)}: invalid JSON (${error.message})`)
  }
}

export async function validators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  addFormats(ajv)
  return {
    hymn: ajv.compile(await readJson(path.join(root, 'schemas/hymn.schema.json'))),
    library: ajv.compile(await readJson(path.join(root, 'schemas/library.schema.json'))),
  }
}

export function schemaErrors(file, validate) {
  return (validate.errors ?? []).map((error) => `${file}${error.instancePath || '/'}: ${error.message}`)
}

export async function hymnFiles(directory = hymnDirectory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && entry.name.endsWith('.json'))
    .map((entry) => path.join(directory, entry.name))
    .sort((a, b) => a.localeCompare(b, 'en'))
}

export function catalogEntry(file, hymn) {
  const filename = path.basename(file)
  const id = filename.slice(0, -'.json'.length)
  if (!kebabPattern.test(id)) throw new Error(`${filename}: filename must be a lowercase kebab-case identifier`)
  if (!hymn.metadata?.language) throw new Error(`${filename}: metadata.language is required for cataloging`)
  if (hymn.title !== hymn.metadata.title) throw new Error(`${filename}: title must match metadata.title`)
  if (hymn.composer !== hymn.metadata.composer) throw new Error(`${filename}: composer must match metadata.composer`)
  const entry = {
    id,
    uuid: hymn.uuid,
    title: hymn.metadata.title,
    composer: hymn.metadata.composer,
    key: hymn.key,
    language: hymn.metadata.language,
  }
  if (hymn.metadata.hymnNumber) {
    if (!/^[1-9]\d*$/.test(hymn.metadata.hymnNumber)) throw new Error(`${filename}: metadata.hymnNumber must be a positive integer when present`)
    entry.number = Number(hymn.metadata.hymnNumber)
  }
  return entry
}

export function sortCatalog(entries) {
  return [...entries].sort((a, b) => {
    const numberOrder = (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER)
    return numberOrder || a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en')
  })
}

export function indexIntegrityErrors(index, files) {
  const errors = []
  const fileUrls = new Set(files.map((file) => `${publicBaseUrl}/hymns/${path.basename(file)}`))
  const urls = new Set()
  for (const url of Array.isArray(index) ? index : []) {
    if (urls.has(url)) errors.push(`index.json: duplicate hymn URL ${url}`)
    urls.add(url)
    if (typeof url === 'string' && url.startsWith(`${publicBaseUrl}/hymns/`) && !fileUrls.has(url)) {
      errors.push(`index.json: missing target ${url}`)
    }
  }
  for (const url of fileUrls) if (!urls.has(url)) errors.push(`index.json: orphaned hymn file ${url}`)
  return errors
}

export async function buildCatalog({ directory = hymnDirectory } = {}) {
  const validate = await validators()
  const entries = []
  const errors = []
  for (const file of await hymnFiles(directory)) {
    try {
      const hymn = await readJson(file)
      if (!validate.hymn(hymn)) {
        errors.push(...schemaErrors(path.relative(root, file), validate.hymn))
        continue
      }
      entries.push(catalogEntry(file, hymn))
    } catch (error) {
      errors.push(error.message)
    }
  }
  const ids = new Set()
  const uuids = new Set()
  for (const entry of entries) {
    if (ids.has(entry.id)) errors.push(`duplicate hymn id: ${entry.id}`)
    if (uuids.has(entry.uuid)) errors.push(`duplicate hymn UUID: ${entry.uuid}`)
    ids.add(entry.id)
    uuids.add(entry.uuid)
  }
  if (errors.length) throw new Error(errors.join('\n'))
  return sortCatalog(entries)
}

export async function buildLibrary(options) {
  return (await buildCatalog(options)).map((entry) => `${publicBaseUrl}/hymns/${entry.id}.json`)
}

export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`

const hymnUrl = (id) => `${publicBaseUrl}/hymns/${id}.json`
const tonicStudioImportUrl = (id) => `${tonicStudioImportBaseUrl}${hymnUrl(id)}`

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

export function renderLandingPage(catalog) {
  const sampleHymnUrl = catalog[0]
    ? hymnUrl(catalog[0].id)
    : hymnUrl('1-example-hymn')
  const rows = catalog.map((entry) => `            <tr>
              <td>${escapeHtml(entry.number ?? '—')}</td>
              <th scope="row"><a href="${tonicStudioImportUrl(entry.id)}">${escapeHtml(entry.title)}</a></th>
              <td>${escapeHtml(entry.composer || 'Unknown')}</td>
              <td>${escapeHtml(entry.key)}</td>
              <td>${escapeHtml(entry.language)}</td>
            </tr>`).join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="A public collection of Chin Christian hymns for Tonic Studio.">
    <title>KhrihfaHlabu — Chin Christian Songbook</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <header class="hero">
      <div class="wrap"><h1>Khrihfa Hlabu</h1></div>
    </header>
    <main class="wrap">
      <section class="import-card" aria-labelledby="import-title">
        <h2 id="import-title">Import the complete library</h2>
        <p>Open the complete hymn library directly in Tonic Studio.</p>
        <a class="import-button" href="${tonicStudioIndexImportUrl}">Import all hymns in Tonic Studio</a>
        <div class="url"><code>${libraryIndexUrl}</code></div>
      </section>
      <section aria-label="Hymn catalog">
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Hymn #</th><th scope="col">Title</th><th scope="col">Composer</th><th scope="col">Doh</th><th scope="col">Language</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table></div>
      </section>
    </main>
  </body>
</html>
`
}
