import http  from 'k6/http';
import { check } from 'k6';

/**
 * Logs in using form-encoded POST, returns the bearer token or null.
 * authConfig shape: { url, usernameField, passwordField, tokenPath }
 */
export function authenticate(authConfig, baseUrl, user) {
  const username = user[authConfig.usernameField];
  const password = user[authConfig.passwordField];

  const payload = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  const res = http.post(
    `${baseUrl}${authConfig.url}`,
    payload,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      tags: { endpoint: 'auth' },
    }
  );

  check(res, { 'auth: status 200': r => r.status === 200 });

  if (res.status !== 200) {
    console.error(`Auth failed for ${username}: HTTP ${res.status}`);
    return null;
  }

  return res.json(authConfig.tokenPath);
}
