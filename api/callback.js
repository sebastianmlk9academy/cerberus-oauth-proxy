module.exports = async (req, res) => {
  try {
    const requestUrl = new URL(req.url, "https://dummy.local");
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");

    const cookie = req.headers.cookie || "";
    const match = cookie.match(/(?:^|;\s*)decap_oauth_state=([^;]+)/);
    const savedState = match ? decodeURIComponent(match[1]) : null;

    if (!state || !savedState || state !== savedState) {
      res.statusCode = 401;
      return res.end("Invalid OAuth state");
    }

    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      res.statusCode = 500;
      return res.end("No access token from GitHub");
    }

    const payload = JSON.stringify({
      token: tokenData.access_token,
      provider: "github",
    });
    const msg = "authorization:github:success:" + payload;

    const html = `<!doctype html><html><body><script>
(function () {
  var msg = ${JSON.stringify(msg)};
  function receiveMessage(e) {
    if (e.data !== "authorizing:github") return;
    window.removeEventListener("message", receiveMessage, false);
    if (window.opener) window.opener.postMessage(msg, e.origin);
    window.close();
  }
  window.addEventListener("message", receiveMessage, false);
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.end("OAuth callback error");
  }
};
