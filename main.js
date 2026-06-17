/**
 * Generic config-driven k6 framework
 *
 * Configuration files (no code changes needed):
 *   config/global.json          — baseUrl, auth, app registry
 *   config/profiles.json        — VU/stage profiles
 *   config/apps/<name>.json     — endpoints per app
 *   data/<name>.csv             — test data per endpoint
 *
 * ENV vars:
 *   BASE_URL   — override baseUrl in global.json
 *   TEST_TYPE  — profile name: dryrun | smoke | load | stress | soak  (default: load)
 *   APPS       — comma-separated app names, or "all"                   (default: all)
 *
 * Examples:
 *   k6 run framework/main.js
 *   k6 run -e TEST_TYPE=smoke -e APPS=api-designer framework/main.js
 *   k6 run -e TEST_TYPE=load  -e APPS=api-designer,api-workspace framework/main.js
 *   k6 run -e TEST_TYPE=stress -e APPS=all framework/main.js
 */

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

import { loadCSV, pickRandom }             from './lib/dataLoader.js';
import { authenticate }                    from './lib/auth.js';
import { selectEndpoint, executeEndpoint } from './lib/runner.js';

// ── Load global config and profiles (init context) ────────────────────────────
const globalConfig = JSON.parse(open('./config/global.json'));
const profiles     = JSON.parse(open('./config/profiles.json'));

const TEST_TYPE = __ENV.TEST_TYPE || 'load';
const BASE_URL  = __ENV.BASE_URL  || globalConfig.baseUrl;

// ── Resolve which apps to run ─────────────────────────────────────────────────
const APPS_ENV = (__ENV.APPS || 'all').trim();
const appNames = APPS_ENV === 'all'
  ? globalConfig.apps
  : APPS_ENV.split(',').map(s => s.trim());

console.log(`Running apps: ${appNames.join(', ')}  |  Profile: ${TEST_TYPE}`);

// ── Load endpoints from selected app files ────────────────────────────────────
const allEndpoints = [];
for (const appName of appNames) {
  const appConfig = JSON.parse(open(`./config/apps/${appName}.json`));
  allEndpoints.push(...appConfig.endpoints);
}

if (allEndpoints.length === 0) {
  throw new Error('No endpoints loaded. Check your APPS env var and app config files.');
}

// ── Pre-load CSV data for all endpoints (init context) ────────────────────────
const userPool = loadCSV(globalConfig.auth.dataFile);

const endpointData = {};
for (const ep of allEndpoints) {
  if (ep.dataFile) {
    endpointData[ep.id] = loadCSV(ep.dataFile);
  }
}

// ── k6 options ────────────────────────────────────────────────────────────────
if (!profiles[TEST_TYPE]) {
  throw new Error(`Unknown TEST_TYPE "${TEST_TYPE}". Valid options: ${Object.keys(profiles).join(', ')}`);
}

export const options = {
  scenarios: {
    default: {
      executor:         'ramping-vus',
      startVUs:         0,
      stages:           profiles[TEST_TYPE].stages,
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed':   ['rate<0.01'],
  },
};

// ── Per-VU state ──────────────────────────────────────────────────────────────
let token = null;

// ── Main loop ─────────────────────────────────────────────────────────────────
export default function () {
  if (!token) {
    const user = pickRandom(userPool);
    token = authenticate(globalConfig.auth, BASE_URL, user);
    if (!token) return;
  }

  const ep   = selectEndpoint(allEndpoints);
  const data = pickRandom(endpointData[ep.id] || null);
  executeEndpoint(ep, data, token, BASE_URL);
}

// ── Summary ───────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'results/summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
