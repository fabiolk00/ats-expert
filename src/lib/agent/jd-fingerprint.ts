/**
 * Produces a stable fingerprint for a job description string.
 *
 * PURPOSE: Deduplication of career fit warnings within a session.
 * Two JD strings that represent the same pasted content should produce
 * the same fingerprint even if the user re-pasted with trailing spaces,
 * different line endings, or minor casing variation.
 *
 * NORMALIZATION APPLIED:
 * - Converts to lowercase
 * - Normalizes CRLF to LF
 * - Collapses repeated horizontal whitespace (spaces and tabs) to single space
 * - Collapses multiple consecutive blank lines to a single newline
 * - Trims leading and trailing whitespace
 *
 * KNOWN LIMITATIONS:
 * - Case-insensitive: "React Engineer" and "react engineer" produce the same
 *   fingerprint. Do not use this function to distinguish JDs that differ only
 *   in capitalization of technology names or company names.
 * - Not a semantic comparator: two JDs for different roles may produce different
 *   fingerprints even if they are functionally equivalent.
 * - Not cryptographic: output is a normalized string, not a hash. Do not use
 *   for security purposes or as a stable external identifier.
 *
 * INTENDED CONSUMERS: agent-loop.ts, profile-review.ts.
 * If you need to add a new consumer, verify that the case-insensitivity
 * limitation is acceptable for your use case before importing.
 *
 * @param jd - Raw job description string as received from user input or session state.
 * @returns Normalized string suitable for equality comparison only.
 */
export function fingerprintJD(jd: string): string {
  return jd
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
