#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { buildLibrary, indexPath, serialize } from './lib.mjs'

const check = process.argv.includes('--check')
try {
  const output = serialize(await buildLibrary())
  if (check) {
    const current = await readFile(indexPath, 'utf8').catch(() => '')
    if (current !== output) throw new Error('index.json is out of date; run npm run build:index')
    console.log('index.json is up to date.')
  } else {
    await writeFile(indexPath, output)
    console.log('Generated index.json.')
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
