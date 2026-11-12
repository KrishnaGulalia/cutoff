async function getHistory(db, userId) {
  // Close expired attempts using the same database clock as the exam screen.
  await db.$executeRaw`UPDATE cutoff.attempts a SET attempt_status='SUBMITTED',submitted_at=clock_timestamp()
    FROM cutoff.tests p WHERE a.test_id=p.test_id AND a.user_id=${userId}::uuid
    AND a.attempt_status='IN_PROGRESS' AND clock_timestamp() >= a.started_at + p.duration_minutes * interval '1 minute'`;
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
