const { createClient } = require('@supabase/supabase-js');
const { AppError } = require('./errors');
let auth;
async function verifyToken(token) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    throw new AppError(503, 'Authentication is not configured yet.');
  }
  if (!auth) auth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) throw new AppError(401, 'Please sign in again.');
  return data.user;
}
module.exports = { verifyToken };
