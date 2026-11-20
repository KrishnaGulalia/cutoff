async function getHistory(db, userId) {
  // Close expired attempts using the same database clock as the exam screen.
  await db.$executeRaw`
    UPDATE cutoff.attempts AS attempt
    SET attempt_status = 'SUBMITTED', submitted_at = clock_timestamp()
    FROM cutoff.tests AS paper
    WHERE attempt.test_id = paper.test_id
      AND attempt.user_id = ${userId}::uuid
      AND attempt.attempt_status = 'IN_PROGRESS'
      AND clock_timestamp() >= attempt.started_at + paper.duration_minutes * interval '1 minute'
  `;

  const rows = await db.attempt.findMany({
    where: { user_id: userId },
    orderBy: [{ started_at: "desc" }, { attempt_id: "desc" }],
    take: 100,
    include: {
      tests: {
        select: { test_title: true, is_demo: true, duration_minutes: true },
      },
    },
  });
  return rows.map(({ tests, ...attempt }) => ({ ...attempt, ...tests }));
}
module.exports = { getHistory };
