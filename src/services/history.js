async function getHistory(database, userId) {
  // Expired attempts become submitted even when the student returns to the dashboard.
  await database.query(`UPDATE cutoff.attempts AS attempt SET attempt_status = 'SUBMITTED', submitted_at = clock_timestamp()
    FROM cutoff.tests AS paper WHERE attempt.test_id = paper.test_id AND attempt.user_id = $1
    AND attempt.attempt_status = 'IN_PROGRESS'
    AND clock_timestamp() >= attempt.started_at + paper.duration_minutes * INTERVAL '1 minute'`, [userId]);
  const result = await database.query(`SELECT attempt.*, paper.test_title, paper.is_demo, paper.duration_minutes
    FROM cutoff.attempts AS attempt JOIN cutoff.tests AS paper ON paper.test_id = attempt.test_id
    WHERE attempt.user_id = $1 ORDER BY attempt.started_at DESC, attempt.attempt_id DESC LIMIT 100`, [userId]);
  return result.rows;
}
module.exports = { getHistory };
