const { AppError } = require("../lib/errors");
function requireAuth(database, verifyToken) {
  return async function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ") || header.length > 12000)
      throw new AppError(401, "Please sign in.");
    const user = await verifyToken(header.slice(7));
    const name =
      String(user.user_metadata?.name || user.email?.split("@")[0] || "Student")
        .trim()
        .slice(0, 80) || "Student";
    await database.query(
      `INSERT INTO cutoff.users(user_id, user_name) VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING`,
      [user.id, name],
    );
    req.user = user;
    next();
  };
}
module.exports = { requireAuth };
