import { describe, expect, it } from 'vitest'

import { fingerprintJD } from './jd-fingerprint'

describe('fingerprintJD', () => {
  it('treats CRLF and LF as equivalent', () => {
    expect(fingerprintJD('line1\r\nline2')).toBe(fingerprintJD('line1\nline2'))
  })

  it('treats trailing whitespace as equivalent', () => {
    expect(fingerprintJD('text  ')).toBe(fingerprintJD('text'))
  })

  it('treats multiple internal spaces as equivalent', () => {
    expect(fingerprintJD('hello   world')).toBe(fingerprintJD('hello world'))
  })

  it('treats multiple blank lines as equivalent', () => {
    expect(fingerprintJD('para1\n\n\npara2')).toBe(fingerprintJD('para1\npara2'))
  })

  it('treats case differences as equivalent', () => {
    expect(fingerprintJD('Senior Engineer')).toBe(fingerprintJD('senior engineer'))
  })

  it('produces different fingerprints for genuinely different JDs', () => {
    expect(fingerprintJD('data engineer role')).not.toBe(
      fingerprintJD('frontend developer role'),
    )
  })
})
