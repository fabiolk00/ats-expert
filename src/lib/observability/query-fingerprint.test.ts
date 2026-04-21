import { describe, expect, it } from 'vitest'

import {
  buildQueryFingerprint,
  normalizeQueryValue,
  summarizePatternStats,
  type QueryPatternStat,
} from './query-fingerprint'

describe('query-fingerprint', () => {
  it('preserves method and path while normalizing eq values', () => {
    expect(buildQueryFingerprint('GET /rest/v1/jobs?id=eq.123&select=*')).toBe(
      'GET /rest/v1/jobs?id=eq.:number&select=*',
    )
    expect(buildQueryFingerprint('GET /rest/v1/jobs?id=eq.456&select=*')).toBe(
      'GET /rest/v1/jobs?id=eq.:number&select=*',
    )
  })

  it('normalizes uuid and opaque values', () => {
    expect(normalizeQueryValue('eq.123e4567-e89b-12d3-a456-426614174000')).toBe('eq.:uuid')
    expect(normalizeQueryValue('eq.abc123def456')).toBe('eq.:value')
    expect(normalizeQueryValue('eq.cancelled')).toBe('eq.cancelled')
    expect(normalizeQueryValue('eq.linkedin')).toBe('eq.linkedin')
  })

  it('normalizes in lists and long comma-separated lists', () => {
    expect(normalizeQueryValue('in.(1,2,3)')).toBe('in.(:list)')
    expect(normalizeQueryValue('alpha123,beta456,gamma789')).toBe(':list')
  })

  it('keeps different select shapes as different fingerprints', () => {
    expect(buildQueryFingerprint('GET /rest/v1/jobs?id=eq.123&select=id,status')).not.toBe(
      buildQueryFingerprint('GET /rest/v1/jobs?id=eq.123&select=id'),
    )
  })

  it('does not collapse different resources together', () => {
    expect(buildQueryFingerprint('GET /rest/v1/jobs?id=eq.123')).not.toBe(
      buildQueryFingerprint('GET /rest/v1/sessions?id=eq.123'),
    )
  })

  it('summarizes repeated pattern stats correctly', () => {
    const stats = new Map<string, QueryPatternStat>([
      ['GET /rest/v1/jobs?id=eq.:number', {
        fingerprint: 'GET /rest/v1/jobs?id=eq.:number',
        sample: 'GET /rest/v1/jobs?id=eq.123',
        count: 4,
      }],
      ['GET /rest/v1/sessions?id=eq.:value', {
        fingerprint: 'GET /rest/v1/sessions?id=eq.:value',
        sample: 'GET /rest/v1/sessions?id=eq.sess_123',
        count: 2,
      }],
    ])

    expect(summarizePatternStats(stats)).toEqual({
      uniqueQueryPatternCount: 2,
      repeatedQueryPatternCount: 1,
      maxRepeatedPatternCount: 4,
      topRepeatedQueryPatterns: [{
        fingerprint: 'GET /rest/v1/jobs?id=eq.:number',
        sample: 'GET /rest/v1/jobs?id=eq.123',
        count: 4,
      }],
    })
  })
})
