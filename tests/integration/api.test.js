const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { Pool } = require("pg");
const request = require("supertest");
const { createApp } = require("../../src/app");
const { migrate } = require("../../scripts/migrate");
const { importPaper } = require("../../src/services/import-paper");
const { AppError } = require("../../src/lib/errors");
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
  !new URL(url).pathname.startsWith("/cutoff_test")
)
  throw new Error("Use a dedicated local cutoff_test database.");
const database = new Pool({ connectionString: url });
const first = crypto.randomUUID(),
  second = crypto.randomUUID();
let app, paper, attempt, questions;
const call = (method, path, token = "first") =>
  request(app)
    [method]("/api" + path)
    .set("Authorization", "Bearer " + token);
before(async () => {
  // Minimal Auth schema for local DB tests, not a replacement for live Supabase Auth.
  await database.query(
    "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY)",
  );
  for (const role of ["anon", "authenticated"])
    await database.query(
      `DO $$ BEGIN CREATE ROLE ${role}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
  await migrate(database);
  await database.query("INSERT INTO auth.users VALUES ($1),($2)", [
    first,
    second,
  ]);
  app = createApp({
    database,
    verifyToken: async (token) => {
      if (!["first", "second"].includes(token))
        throw new AppError(401, "Invalid session.");
      return {
        id: token === "first" ? first : second,
        email: token + "@example.test",
        user_metadata: { name: "Test Student" },
      };
    },
  });
  await call("get", "/me");
  await call("get", "/me", "second");
  const fixture = structuredClone(require("../../data/demo-paper.json"));
  fixture.title += " " + crypto.randomUUID();
  paper = await importPaper(database, fixture);
});
after(async () => database.end());
test("real database API journey", async (t) => {
  await t.test("missing and invalid sessions are rejected", async () => {
    assert.equal((await request(app).get("/api/papers")).status, 401);
    assert.equal((await call("get", "/papers", "wrong")).status, 401);
  });
  await t.test(
    "profile uses authenticated user, not client-provided IDs",
    async () => {
      const profile = await call("get", "/me");
      assert.equal(profile.body.user_id, first);
      assert.equal(profile.body.password_hash, undefined);
      assert.equal(
        (await call("patch", "/me").send({ name: "Krishna", user_id: second }))
          .status,
        200,
      );
      assert.equal(
        (await call("get", "/me", "second")).body.user_name,
        "Test Student",
      );
    },
  );
  await t.test("catalogue counts and filters are correct", async () => {
    const papers = await call("get", "/papers?year=2026&search=starter");
    assert.equal(papers.status, 200);
    assert.equal(
      papers.body.find((item) => item.test_id === paper).question_count,
      6,
    );
    assert.equal((await call("get", "/papers?year=wrong")).status, 400);
  });
  await t.test("concurrent starts share one active attempt", async () => {
    const responses = await Promise.all([
      call("post", `/papers/${paper}/attempts`),
      call("post", `/papers/${paper}/attempts`),
    ]);
    assert.ok(responses.every((response) => response.status === 200));
    assert.equal(responses[0].body.attempt_id, responses[1].body.attempt_id);
    attempt = responses[0].body.attempt_id;
  });
  await t.test("delivery contains no keys or explanations", async () => {
    const response = await call("get", `/attempts/${attempt}`);
    questions = response.body.questions;
    assert.equal(questions.length, 6);
    for (const question of questions)
      for (const field of [
        "correctOptions",
        "numericalKey",
        "explanation_text",
      ])
        assert.equal(question[field], undefined);
    assert.equal(
      (await call("get", `/attempts/${attempt}/results`)).status,
      409,
    );
    assert.equal(
      (await call("get", `/attempts/${attempt}`, "second")).status,
      404,
    );
  });
  const answer = (selectedOptions = [], numericalResponse = null) => ({
    selectedOptions,
    numericalResponse,
    markedForReview: false,
    timeSpentSeconds: 20,
  });
  await t.test("save, replace, clear and resume work", async () => {
    const path = `/attempts/${attempt}/answers/${questions[0].question_id}`;
    assert.equal((await call("put", path).send(answer(["A"]))).status, 200);
    assert.equal((await call("put", path).send(answer(["B"]))).status, 200);
    assert.equal((await call("put", path).send(answer())).status, 200);
    await call("put", path).send(answer(["B"]));
    const saved = (await call("get", `/attempts/${attempt}`)).body.answers[0];
    assert.deepEqual(saved.selectedOptions, ["B"]);
    assert.equal(saved.time_spent_seconds, 20);
  });
  await t.test("invalid replacement rolls back the full answer", async () => {
    const path = `/attempts/${attempt}/answers/${questions[0].question_id}`;
    assert.equal(
      (await call("put", path).send({ ...answer(["Z"]), timeSpentSeconds: 99 }))
        .status,
      400,
    );
    const saved = (await call("get", `/attempts/${attempt}`)).body.answers[0];
    assert.deepEqual(saved.selectedOptions, ["B"]);
    assert.equal(saved.time_spent_seconds, 20);
    assert.equal(
      (await call("put", path).send(answer(["A", "B"]))).status,
      400,
    );
    assert.equal(
      (await call("put", path, "second").send(answer(["B"]))).status,
      404,
    );
  });
  await t.test(
    "multiple-select and zero score correctly after submission",
    async () => {
      await call(
        "put",
        `/attempts/${attempt}/answers/${questions[1].question_id}`,
      ).send(answer(["C", "A"]));
      await call(
        "put",
        `/attempts/${attempt}/answers/${questions[4].question_id}`,
      ).send(answer([], 0));
      await call(
        "put",
        `/attempts/${attempt}/answers/${questions[5].question_id}`,
      ).send(answer(["A"]));
      assert.equal(
        (await call("post", `/attempts/${attempt}/submit`)).status,
        200,
      );
      const result = await call("get", `/attempts/${attempt}/results`);
      assert.equal(result.status, 200);
      assert.equal(result.body.summary.score, 11);
      assert.equal(result.body.summary.correct, 3);
      assert.equal(result.body.summary.incorrect, 1);
      assert.equal(result.body.summary.skipped, 2);
      assert.equal(result.body.summary.accuracy, 75);
      assert.equal(result.body.analytics.subjects.length, 3);
    },
  );
  await t.test(
    "submission is idempotent and later answers are blocked",
    async () => {
      assert.equal(
        (await call("post", `/attempts/${attempt}/submit`)).status,
        200,
      );
      assert.equal(
        (
          await call(
            "put",
            `/attempts/${attempt}/answers/${questions[0].question_id}`,
          ).send(answer(["A"]))
        ).status,
        409,
      );
      assert.equal(
        (await call("get", `/attempts/${attempt}/results`, "second")).status,
        404,
      );
      const next = await call("post", `/papers/${paper}/attempts`);
      assert.notEqual(next.body.attempt_id, attempt);
      await call("post", `/attempts/${next.body.attempt_id}/submit`);
      assert.equal(
        (await call("get", `/attempts/${next.body.attempt_id}/results`)).body
          .summary.accuracy,
        null,
      );
    },
  );
  await t.test(
    "timeout persists submission even when a save is rejected",
    async () => {
      const expired = (
        await database.query(
          `INSERT INTO cutoff.attempts(user_id,test_id,started_at) VALUES ($1,$2,now()-INTERVAL '1 hour') RETURNING attempt_id`,
          [first, paper],
        )
      ).rows[0].attempt_id;
      assert.equal(
        (
          await call(
            "put",
            `/attempts/${expired}/answers/${questions[0].question_id}`,
          ).send(answer(["B"]))
        ).status,
        409,
      );
      assert.equal(
        (await call("get", `/attempts/${expired}/results`)).status,
        200,
      );
    },
  );
  await t.test("history is scoped to its student", async () => {
    assert.ok((await call("get", "/attempts")).body.length >= 3);
    assert.deepEqual((await call("get", "/attempts", "second")).body, []);
  });
  await t.test("browser roles cannot read answer keys", async () => {
    const client = await database.connect();
    try {
      await client.query("SET ROLE authenticated");
      await assert.rejects(
        client.query("SELECT * FROM cutoff.correct_options"),
        { code: "42501" },
      );
    } finally {
      await client.query("RESET ROLE");
      client.release();
    }
  });
  await t.test(
    "submission waits for an in-flight answer transaction",
    async () => {
      const active = (await call("post", `/papers/${paper}/attempts`)).body
        .attempt_id;
      const client = await database.connect();
      await client.query("BEGIN");
      try {
        await client.query(
          "SELECT * FROM cutoff.attempts WHERE attempt_id=$1 FOR UPDATE",
          [active],
        );
        await client.query(
          "INSERT INTO cutoff.answers(attempt_id,question_id) VALUES ($1,$2)",
          [active, questions[0].question_id],
        );
        let completed = false;
        const pending = call("post", `/attempts/${active}/submit`).then(
          (result) => {
            completed = true;
            return result;
          },
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
        assert.equal(completed, false);
        await client.query(
          "INSERT INTO cutoff.answer_options VALUES ($1,$2,$3)",
          [active, questions[0].question_id, "B"],
        );
        await client.query("COMMIT");
        assert.equal((await pending).status, 200);
        assert.equal(
          (await call("get", `/attempts/${active}/results`)).body.summary.score,
          4,
        );
      } finally {
        await client.query("ROLLBACK");
        client.release();
      }
    },
  );
});
