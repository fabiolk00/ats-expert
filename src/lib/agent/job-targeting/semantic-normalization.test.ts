import { describe, expect, it } from 'vitest'

import { buildAcronym, hasLexicalAliasMatch } from '@/lib/agent/job-targeting/semantic-normalization'

describe('semantic normalization acronym safety', () => {
  it('does not treat short ambiguous acronyms as safe automatic aliases', () => {
    expect(buildAcronym('PM')).toBeNull()
    expect(buildAcronym('QA')).toBeNull()
    expect(hasLexicalAliasMatch('PM', 'Product Manager')).toBe(false)
    expect(hasLexicalAliasMatch('QA', 'Quality Assurance')).toBe(false)
  })

  it('promotes 3+ acronyms only when there is real expanded-form support', () => {
    expect(buildAcronym('Customer Relationship Management')).toBe('crm')
    expect(buildAcronym('Customer Relationship Management (CRM)')).toBe('crm')
    expect(buildAcronym('CRM')).toBe('crm')
    expect(hasLexicalAliasMatch('CRM', 'Customer Relationship Management')).toBe(true)
  })

  it('does not promote 3+ acronyms without contextual or expanded-form support', () => {
    expect(hasLexicalAliasMatch('CRM strategy', 'customer retention metrics and sales reporting')).toBe(false)
    expect(hasLexicalAliasMatch('ESG reporting', 'corporate reports and compliance support')).toBe(false)
  })

  it('supports acronym-style forms with separators only when the expansion is real', () => {
    expect(buildAcronym('FP&A')).toBe('fpa')
    expect(buildAcronym('Financial planning and analysis')).toBe('fpa')
    expect(hasLexicalAliasMatch('FP&A', 'Financial planning and analysis')).toBe(true)
    expect(hasLexicalAliasMatch('FP&A manager', 'monthly financial reports')).toBe(false)
  })
})
