import { SharedArray } from 'k6/data';
import papaparse      from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Cache prevents duplicate SharedArray names for the same file
const _cache = {};

/**
 * Loads a CSV file into a SharedArray (init context only).
 * filePath is relative to the framework/ root, e.g. "data/users.csv".
 */
export function loadCSV(filePath) {
  if (!filePath) return null;
  if (!_cache[filePath]) {
    _cache[filePath] = new SharedArray(filePath, function () {
      return papaparse.parse(open(`../${filePath}`), {
        header: true,
        skipEmptyLines: true,
      }).data;
    });
  }
  return _cache[filePath];
}

/** Returns a uniformly random row from an array, or {} if empty/null. */
export function pickRandom(arr) {
  if (!arr || arr.length === 0) return {};
  return arr[Math.floor(Math.random() * arr.length)];
}
