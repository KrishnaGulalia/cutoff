# Adding verified papers

The exact working example is `data/demo-paper.json`. Keep its structure.

| Paper field | Meaning |
|---|---|
| title | Display title, including a version if correcting an imported paper |
| year | Integer exam year |
| session | Date/session/shift description |
| durationMinutes | Integer from 1 to 300 |
| sourceReference | Human-readable original source and answer-key reference |
| isDemo | true for original demo content; false for verified historical material |
| verified | Must be true after checking the content and keys |
| questions | Ordered list of 1–200 question objects |

Each question supplies `subject` (Physics, Chemistry or Mathematics), `chapter`,
`topic` (text or null), `text`, `type`, `difficulty`, `explanation`, `images`,
`options`, `correctOptions`, `numericalKey` and `marks`.

Types: `SINGLE_CHOICE`, `MULTIPLE_SELECT`, `NUMERICAL`.
Difficulties: `easy`, `medium`, `hard`.
Images: arrays of HTTPS image URLs. Host images at stable, publicly readable URLs;
never include private credentials in image links. Text is rendered as plain text,
not HTML. LaTeX rendering and image upload tools are future additions.

Choice options contain `label` (A–Z), `text`, and `images`. An image-only option
may have empty text. A single-choice question has one correct label; multiple-select
questions have one or more. Both use `numericalKey: null`.

Numerical questions use `options: []`, `correctOptions: []`, and a key such as
`{ "min": 1.25, "max": 1.25 }`. Equal bounds mean an exact answer; different bounds
represent a verified acceptance interval. The app does not invent tolerance.

Marks are `{ "correct": 4, "incorrect": -1, "unattempted": 0 }` unless the source
uses a different supported scheme. Enter the incorrect award as a negative value.
This MVP uses exact-set scoring for multiple-select; it does not implement partial credit.

```bash
npm run data:validate -- data/papers/my-paper.json
npm run data:import -- data/papers/my-paper.json
```

The validator checks structure, not scientific correctness or copyright permissions.
Atharv prepares the data; Srijan verifies the questions, answer keys and taxonomy.
Use consistent chapter/topic spelling. The importer reuses matching classification
rows and creates new question rows for each imported paper. The underlying schema
supports question reuse; automated cross-paper deduplication is not implemented.

Nothing is visible until the full import commits. Imports do not overwrite an
existing paper or affect earlier results. To correct a paper, import a new version
with a distinct title/session and retain the original attempt history.
