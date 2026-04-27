const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const state = crypto.randomBytes(16).toString("hex");

  res.setHeader(
    "Set-Cookie",
    `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const redirect = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&scope=${encodeURIComponent("repo,user")}&state=${encodeURIComponent(state)}`;

  res.writeHead(302, { Location: redirect });
  res.end();
};
