#!/usr/bin/env node
import path from 'node:path'
import { hymnFiles, indexIntegrityErrors, indexPath, readJson, root, schemaErrors, validators } from './lib.mjs'

try {
  const validate = await validators()
  const errors = []
  const files = await hymnFiles()
  const index = await readJson(indexPath)
  if (!validate.library(index)) errors.push(...schemaErrors('index.json', validate.library))

  for (const file of files) {
    try {
      const hymn = await readJson(file)
      if (!validate.hymn(hymn)) errors.push(...schemaErrors(path.relative(root, file), validate.hymn))
    } catch (error) {
      errors.push(error.message)
    }
  }
  errors.push(...indexIntegrityErrors(index, files))
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(`Validated ${files.length} hymn file(s) and index.json.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
