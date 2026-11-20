const { AppError } = require("../lib/errors");
const { verifyToken } = require("../lib/supabase");
const { prisma } = require("../lib/db");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ") || header.length > 12000) {
    throw new AppError(401, "Please sign in.");
  }
  const token = header.slice("Bearer ".length);
  const user = await verifyToken(token);

  // Use the email prefix when the student signed up without a display name.
  const emailName = user.email?.split("@")[0];
  const displayName = user.user_metadata?.name || emailName || "Student";
  const name = String(displayName).trim().slice(0, 80) || "Student";

  await prisma.user.createMany({
    data: [{ user_id: user.id, user_name: name }],
    skipDuplicates: true,
  });
  req.user = user;
  next();
}
module.exports = { requireAuth };
