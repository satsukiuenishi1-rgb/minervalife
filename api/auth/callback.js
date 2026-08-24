// GET /api/auth/callback
// Exchanges the authorization code for a refresh token, then redirects
// back to the app with the refresh token in the URL hash (never sent to
// any server logs since hash fragments are not transmitted over HTTP).

export default async function handler(req, res) {
  const { code, error } = req.query;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  if (error) {
    res.writeHead(302, { Location: `${proto}://${host}/#gmail_error=${encodeURIComponent(error)}` });
    res.end();
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send("Google OAuth is not configured on the server.");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.refresh_token) {
      const msg = data.error_description || data.error || "no_refresh_token";
      res.writeHead(302, { Location: `${proto}://${host}/#gmail_error=${encodeURIComponent(msg)}` });
      res.end();
      return;
    }

    res.writeHead(302, {
      Location: `${proto}://${host}/#gmail_connected=1&rt=${encodeURIComponent(data.refresh_token)}`,
    });
    res.end();
  } catch (err) {
    res.writeHead(302, {
      Location: `${proto}://${host}/#gmail_error=${encodeURIComponent(String(err))}`,
    });
    res.end();
  }
}
