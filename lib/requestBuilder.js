/**
 * Replaces {placeholder} tokens in a string using values from a data row.
 * Unknown placeholders are left as-is so errors are visible in logs.
 */
function substitute(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    data[key] !== undefined ? data[key] : `{${key}}`
  );
}

/** Applies substitution to a URL string. */
export function buildUrl(urlTemplate, data) {
  return substitute(urlTemplate, data);
}

/**
 * Applies substitution to a body object (values only) or body string.
 * Returns the processed object ready to pass to JSON.stringify().
 */
export function buildBody(bodyTemplate, data) {
  if (!bodyTemplate) return null;

  if (typeof bodyTemplate === 'string') {
    return substitute(bodyTemplate, data);
  }

  const result = {};
  for (const [key, value] of Object.entries(bodyTemplate)) {
    result[key] = typeof value === 'string' ? substitute(value, data) : value;
  }
  return result;
}
