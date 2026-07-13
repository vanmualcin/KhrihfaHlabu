# KhrihfaHlabu

KhrihfaHlabu (“Christian Songbook” in Chin) is a public, version-controlled collection of Chin Christian hymn data designed for Tonic Studio and other compatible applications. It is a static data library—not the Tonic Studio application, a web application, or an API.

The published library is expected at `https://khrihfahlabu.mualcin.com`. This project is experimental; its library schema may evolve as remote-library support is added to Tonic Studio.

## Using the library

Applications can fetch either a single Tonic Studio score or the catalog that points to every published score:

```text
https://khrihfahlabu.mualcin.com/hymns/example-hymn.json
https://khrihfahlabu.mualcin.com/index.json
```

Before the custom domain is active, substitute the repository owner in these GitHub Pages project-site URLs:

```text
https://<owner>.github.io/KhrihfaHlabu/hymns/example-hymn.json
https://<owner>.github.io/KhrihfaHlabu/index.json
```

To import all hymns, fetch `index.json`, identify it by `"format": "tonic-studio-library"`, and resolve each catalog `url` relative to the index URL. The relative links work both under GitHub Pages’ `/KhrihfaHlabu/` subpath and at a custom domain.

Tonic Studio does not yet implement remote URL or library-index imports. The URLs are ready for that integration, but current Tonic Studio users must download an individual file and use its file importer.

## Repository layout

- `hymns/` contains import-compatible Tonic Studio version 2 score documents.
- `schemas/` contains JSON Schema 2020-12 schemas for hymns and the library index.
- `index.json` is the generated, compact catalog. Do not edit its hymn list manually.
- `scripts/` contains the Node.js validator and deterministic index builder.

The included `example-hymn.json` is synthetic documentation data, not an authoritative hymn transcription.

## Local development

Node.js 22 or newer is supported.

```sh
npm install
npm run validate
npm run build:index
npm run check:index
npm test
```

`build:index` preserves the committed `updatedAt` value to avoid meaningless diffs. Maintainers update that release timestamp intentionally when publishing a content release. `check:index` fails if the committed catalog differs from deterministic generation.

## Adding a hymn

1. Export or create a valid Tonic Studio version 2 score.
2. Choose a permanent lowercase kebab-case ID, such as `pathian-ka-fak`.
3. Save it as `hymns/pathian-ka-fak.json`; the filename is its catalog ID.
4. Supply `metadata.title`, `metadata.composer`, and `metadata.language` (normally `cnh`). A numeric `metadata.hymnNumber` is optional.
5. Run `npm run validate`, `npm run build:index`, `npm run check:index`, and `npm test`.
6. Submit the hymn and regenerated index in a pull request.

For ordinary corrections, keep the ID and filename stable so the public URL remains stable. The initial catalog assigns revision `1` because Tonic Studio’s score format has no revision field; a future catalog-maintenance mechanism should increment revisions without adding incompatible top-level score fields.

## Format compatibility

The hymn schema follows the current Tonic Studio `Score` interface and importer: `format: "tonic-studio"`, version 2, metadata, key and meter, SATB parts, note-level lyric syllables, sections/refrains, repeat directives, and playback order. Tonic Studio also imports legacy version 1 documents and normalizes them to version 2, but this library publishes only canonical version 2 documents.

Top-level hymn IDs, languages, and revisions were deliberately not added to score files because they are not part of the current `Score` interface. Identity comes from the filename; language comes from supported score metadata; revision is catalog-only.

## Copyright and licensing

Contributors must have the right to publish every submitted lyric, translation, notation, and item of metadata. Do not assume a hymn is public domain merely because it is old or traditional. Individual hymn rights may vary and should be stated in `metadata.copyright` when known.

Repository tooling, workflows, documentation, and schemas are MIT-licensed. Hymn content is not automatically covered by that software license; see [LICENSE](./LICENSE) for the separation of terms.
