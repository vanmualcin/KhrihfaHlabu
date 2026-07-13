#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { buildCatalog, buildLibrary, indexPath, landingPath, renderLandingPage, serialize } from './lib.mjs'

const check = process.argv.includes('--check')
try {
  const output = serialize(await buildLibrary())
  const landing = renderLandingPage(await buildCatalog())
  if (check) {
    const current = await readFile(indexPath, 'utf8').catch(() => '')
    if (current !== output) throw new Error('index.json is out of date; run npm run build:index')
    const currentLanding = await readFile(landingPath, 'utf8').catch(() => '')
    if (currentLanding !== landing) throw new Error('index.html is out of date; run npm run build:index')
    console.log('index.json and index.html are up to date.')
  } else {
    await writeFile(indexPath, output)
    await writeFile(landingPath, landing)
    console.log('Generated index.json and index.html.')
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
