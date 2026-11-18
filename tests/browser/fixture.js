const user = {
  id: "00000000-0000-4000-8000-000000000011",
  email: "krishna@example.test",
  user_metadata: { name: "Krishna" },
  aud: "authenticated",
  role: "authenticated",
};
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const token =
  encode({ alg: "HS256", typ: "JWT" }) +
  "." +
  encode({
    sub: user.id,
    exp: 4102444800,
    aud: "authenticated",
    role: "authenticated",
  }) +
  ".local-test-signature";
const session = {
  access_token: token,
  refresh_token: "local-test-refresh",
  expires_at: 4102444800,
  expires_in: 3600,
  token_type: "bearer",
  user,
};
module.exports = { user, token, session };
