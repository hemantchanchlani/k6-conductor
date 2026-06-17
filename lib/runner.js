import http         from 'k6/http';
import { check, sleep } from 'k6';
import { buildUrl, buildBody } from './requestBuilder.js';

/**
 * Picks one endpoint from the list using weighted random selection.
 * Weights are relative — they do not need to sum to 100.
 */
export function selectEndpoint(endpoints) {
  const total = endpoints.reduce((sum, ep) => sum + (ep.weight || 1), 0);
  let r = Math.random() * total;
  for (const ep of endpoints) {
    r -= ep.weight || 1;
    if (r <= 0) return ep;
  }
  return endpoints[endpoints.length - 1];
}

/**
 * Executes a single endpoint call:
 *   1. Substitutes {placeholders} in URL and body from the data row
 *   2. Fires the HTTP request with Bearer token
 *   3. Runs the configured check (status code)
 *   4. Sleeps for the configured think time
 */
export function executeEndpoint(ep, data, token, baseUrl) {
  const url    = baseUrl + buildUrl(ep.url, data);
  const body   = ep.body ? JSON.stringify(buildBody(ep.body, data)) : null;
  const params = {
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    tags: { endpoint: ep.id },
  };

  let res;
  switch (ep.method.toUpperCase()) {
    case 'GET':    res = http.get(url, params);               break;
    case 'POST':   res = http.post(url, body, params);        break;
    case 'PUT':    res = http.put(url, body, params);         break;
    case 'PATCH':  res = http.patch(url, body, params);       break;
    case 'DELETE': res = http.del(url, null, params);         break;
    default:
      console.error(`Unsupported method: ${ep.method} for endpoint ${ep.id}`);
      return null;
  }

  const expectedStatus = ep.checks && ep.checks.status ? ep.checks.status : 200;
  check(res, { [`${ep.id}: status ${expectedStatus}`]: r => r.status === expectedStatus });

  // Think time — random within configured range
  const min = ep.thinkTime ? ep.thinkTime.min : 1;
  const max = ep.thinkTime ? ep.thinkTime.max : 3;
  sleep(min + Math.random() * (max - min));

  return res;
}
