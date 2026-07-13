# KhrihfaHlabu

KhrihfaHlabu is a public, version-controlled collection of Chin Christian hymn data designed for Tonic Studio. It is a static hymn library and documentation site—not the Tonic Studio application or an API.

- [Open Tonic Studio](https://tonicsolfege.mualcin.com)
- [Browse the Khrihfa Hlabu hymn library](https://khrihfahlabu.mualcin.com)

## Using the library

Import the complete collection using:

```text
https://tonicsolfege.mualcin.com?import_by_index=https://khrihfahlabu.mualcin.com/index.json
```

The landing page provides this as a one-click import action. Its `index.json` is a plain JSON array containing the absolute HTTPS URL of every published hymn. To import one hymn, use its individual URL:

```text
https://khrihfahlabu.mualcin.com/hymns/1-pathian-cu-thangthat-si-ko-seh.json
```

Tonic Studio recognizes `import_by_index` for a library URL and `import` for an individual hymn URL.

## Repository layout

- `hymns/` contains import-compatible Tonic Studio version 2 score documents.
- `schemas/` contains JSON Schema 2020-12 schemas for hymns and the URL index.
- `index.json` is the generated array consumed by Tonic Studio.
- `index.html` is the generated landing page and hymn catalog.
- `styles.css` provides the landing page presentation.
- `scripts/` contains validation and deterministic generation tooling.

The published hymn URLs are stable identifiers; ordinary content corrections should keep the filename unchanged.

## Local development

Node.js 22 or newer is supported.

```sh
npm install
npm run validate
npm run build:index
npm run check:index
npm test
```

`build:index` validates hymn metadata, then regenerates both `index.json` and the catalog in `index.html`. `check:index` fails when either committed output is outdated.

## Adding or updating a hymn

1. Export or create a valid Tonic Studio version 2 score.
2. Choose a permanent lowercase kebab-case ID, such as `pathian-ka-fak`.
3. Save it as `hymns/pathian-ka-fak.json`; the filename is its identity and stable URL.
4. Preserve the exported top-level `uuid`, and supply `metadata.title`, `metadata.composer`, and `metadata.language`. Add a numeric `metadata.hymnNumber` when known.
5. Run the validation, build, index check, and test commands above.
6. Submit the hymn and both regenerated index files in a pull request.

For ordinary corrections, keep the filename unchanged. Hymn numbers can vary between editions and are not permanent identity.

## Format compatibility

The hymn schema follows Tonic Studio’s current `Score` interface and importer: `format: "tonic-studio"`, version 2, UUID identity, metadata, key and meter, SATB parts, note-level lyric syllables, sections/refrains, repeat directives, and playback order. The catalog’s “Doh” column displays each score’s `key` value.

Top-level catalog fields are not added to score documents because they are not part of Tonic Studio’s current format. The simplified library index intentionally contains only hymn URLs.

## Copyright and licensing

Contributors must have the right to publish every submitted lyric, translation, notation, and item of metadata. Do not assume that a traditional or old hymn is necessarily public domain. Individual rights may vary and should be stated in `metadata.copyright` when known.

Repository tooling, workflows, documentation, and schemas are MIT-licensed. Hymn content is not automatically covered by that software license; see [LICENSE](./LICENSE).
