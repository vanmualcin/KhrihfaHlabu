# Contributing to KhrihfaHlabu

Thank you for helping preserve Chin Christian hymn texts and notation carefully.

## Hymn files

- Name each file with a stable lowercase kebab-case ID: `hymns/pathian-ka-fak.json`.
- Export canonical Tonic Solfège version 2 JSON whenever possible.
- Preserve the valid top-level UUID created by Tonic Solfège. Never reuse one hymn's UUID for a different hymn.
- Keep the existing filename for corrections. Hymn numbers are edition-specific and are not permanent IDs.
- Include catalogable metadata: title, composer (an empty string is allowed when unknown), and language. Use ISO 639-3 `cnh` for Hakha Chin. A hymn number, if supplied, must be a positive integer string.
- State the known rights basis in `metadata.copyright`: public domain, original work, or permission from the rights holder. Explain permission in the pull request without publishing private personal information.
- Do not add unrelated files, executable content, secrets, generated dependency folders, HTML, or scripts inside hymn data.

The text deserves respectful treatment. Preserve the intended wording, diacritics, and historical spelling rather than silently modernizing it. If a scan, pitch, syllable, attribution, or translation is uncertain, describe the uncertainty in the pull request and, when useful, in a concise metadata field. Do not guess without disclosure.

## Validation workflow

```sh
npm install
npm run validate
npm run build:index
npm run check:index
npm test
```

Run `build:index` after adding, renaming, or removing a hymn, then commit both generated files: `index.json` and `index.html`. Validation rejects malformed JSON, unsupported score versions, invalid score structures, unsafe or unexpected URLs, duplicate URLs, missing targets, and orphaned hymn files.

## Pull requests and corrections

Keep each pull request focused. Explain the source, transcription method, rights status, and all intentional textual or musical changes. For corrections, identify the evidence and leave the stable ID and URL unchanged. Reviewers may request clarification when two submissions appear to represent the same hymn under different names.

By submitting, you confirm that you have the right to publish your contribution under the terms you identify. Do not claim ownership of traditional or pre-existing material you do not own.
