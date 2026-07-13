import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const hymnDirectory = path.join(root, 'hymns')
export const indexPath = path.join(root, 'index.json')
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
  const hymnSchema = await readJson(path.join(root, 'schemas/hymn.schema.json'))
  const librarySchema = await readJson(path.join(root, 'schemas/library.schema.json'))
  return { hymn: ajv.compile(hymnSchema), library: ajv.compile(librarySchema) }
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
  const entry = { id, title: hymn.metadata.title }
  if (hymn.metadata.hymnNumber) {
    if (!/^[1-9]\d*$/.test(hymn.metadata.hymnNumber)) throw new Error(`${filename}: metadata.hymnNumber must be a positive integer when present`)
    entry.number = Number(hymn.metadata.hymnNumber)
  }
  return { ...entry, language: hymn.metadata.language, revision: 1, url: `./hymns/${filename}` }
}

export function sortCatalog(entries) {
  return [...entries].sort((a, b) => {
    const numberOrder = (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER)
    return numberOrder || a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en')
  })
}

export function indexIntegrityErrors(index, files) {
  const errors = []
  const fileUrls = new Set(files.map((file) => `./hymns/${path.basename(file)}`))
  const ids = new Set()
  const urls = new Set()
  for (const entry of Array.isArray(index.hymns) ? index.hymns : []) {
    if (ids.has(entry.id)) errors.push(`index.json: duplicate hymn id ${entry.id}`)
    if (urls.has(entry.url)) errors.push(`index.json: duplicate hymn URL ${entry.url}`)
    ids.add(entry.id)
    urls.add(entry.url)
    if (typeof entry.url !== 'string' || !entry.url.startsWith('./hymns/')) continue
    const normalized = path.posix.normalize(entry.url)
    if (!/^\.\/hymns\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(entry.url) || normalized.includes('..')) {
      errors.push(`index.json: unsafe hymn path ${entry.url}`)
    } else if (!fileUrls.has(entry.url)) {
      errors.push(`index.json: missing target ${entry.url}`)
    }
  }
  for (const url of fileUrls) if (!urls.has(url)) errors.push(`index.json: orphaned hymn file ${url}`)
  return errors
}

export async function buildLibrary({ directory = hymnDirectory, currentIndex = indexPath } = {}) {
  const validate = await validators()
  const files = await hymnFiles(directory)
  const errors = []
  const entries = []
  for (const file of files) {
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
  for (const field of ['id', 'url']) {
    const seen = new Set()
    for (const entry of entries) {
      if (seen.has(entry[field])) errors.push(`duplicate hymn ${field}: ${entry[field]}`)
      seen.add(entry[field])
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
  let updatedAt = '2026-07-12T00:00:00Z'
  try {
    const current = await readJson(currentIndex)
    if (typeof current.updatedAt === 'string') updatedAt = current.updatedAt
  } catch (error) {
    if (!error.message.includes('ENOENT')) throw error
  }
  return {
    format: 'tonic-studio-library',
    schemaVersion: 1,
    name: 'KhrihfaHlabu',
    description: 'A public collection of Chin Christian hymns for Tonic Studio.',
    language: 'cnh',
    updatedAt,
    hymns: sortCatalog(entries),
  }
}

export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`
