# Student API

All routes use the `/api` prefix. Except health checks, send
`Authorization: Bearer <Supabase access token>`. The server verifies the token and
uses its user ID. A user ID sent in the body never controls ownership.
Responses are JSON. Errors use `{ "error": "Readable message" }`.

| Method | Path                              | Purpose                                       |
| ------ | --------------------------------- | --------------------------------------------- |
| GET    | /health                           | Server status                                 |
| GET    | /health/db                        | Database/schema readiness                     |
| GET    | /me                               | Current profile and Auth email                |
| PATCH  | /me                               | Update display name: `{ "name": "Krishna" }`  |
| GET    | /papers?year=2026&search=April    | Up to 100 matching papers                     |
| GET    | /papers/:id                       | Paper metadata, count and maximum marks       |
| POST   | /papers/:id/attempts              | Start a new attempt or resume the active one  |
| GET    | /attempts                         | Latest 100 attempts for this student          |
| GET    | /attempts/:id                     | Metadata, safe questions and saved responses  |
| PUT    | /attempts/:id/answers/:questionId | Replace the entire response state             |
| POST   | /attempts/:id/submit              | Submit once; repeated submission is harmless  |
| GET    | /attempts/:id/results             | Submitted results, keys and grouped analytics |

## Answer payload

```json
{
  "selectedOptions": ["A", "C"],
  "numericalResponse": null,
  "markedForReview": true,
  "timeSpentSeconds": 45
}
```

For numerical answers use an empty selectedOptions list and a finite number.
Zero is valid. An empty list plus null clears a response. Time is the cumulative
per-question total, not an increment; retrying a save cannot add time twice.
Saves lock the attempt and replace answer/options in one transaction. Invalid
options roll back the whole replacement. A closed attempt returns 409.

## Scoring

- Single-choice: selected option must equal the correct option.
- Multiple-select: the complete sets must match, with no extra options.
- Numerical: the response must lie within the inclusive accepted range.
- Unanswered: zero marks. Incorrect: the signed `marks_incorrect` value.
- Accuracy: correct / (correct + incorrect) × 100; null when nothing was attempted.

Delivery never includes answer keys or explanations. Result routes reveal them
only for the requesting student's submitted attempt. Scores are calculated from
stored responses and paper-specific marks; no cached score column is maintained.

Question IDs and attempt IDs are returned as strings to preserve PostgreSQL BIGINT
precision. A Supabase user ID is a UUID string.

## Boundaries

Paper imports run through the trusted local CLI, not a public admin endpoint.
History and catalogue currently cap at 100 rows, sufficient for the capstone
scope; add pagination before growing beyond that. There are no invented ranks,
percentiles, predictions, leaderboards or historical benchmark claims.
