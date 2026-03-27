import { describe, it, expect } from 'vitest'
import { extractUrl, isJobPostingUrl } from './url-extractor'

describe('extractUrl', () => {
  it('extracts a URL from text', () => {
    expect(extractUrl('Olha essa vaga https://www.linkedin.com/jobs/view/123')).toBe(
      'https://www.linkedin.com/jobs/view/123'
    )
  })

  it('returns null when no URL present', () => {
    expect(extractUrl('Quero analisar meu currículo')).toBeNull()
  })

  it('extracts first URL when multiple are present', () => {
    const text = 'Veja https://gupy.io/vaga/123 e https://catho.com.br/vaga/456'
    expect(extractUrl(text)).toBe('https://gupy.io/vaga/123')
  })

  it('handles URL at the start of text', () => {
    expect(extractUrl('https://indeed.com/job/123 essa é a vaga')).toBe(
      'https://indeed.com/job/123'
    )
  })

  it('handles URL at the end of text', () => {
    expect(extractUrl('A vaga é essa: https://vagas.com.br/vaga/123')).toBe(
      'https://vagas.com.br/vaga/123'
    )
  })

  it('extracts http URLs', () => {
    expect(extractUrl('Veja http://gupy.io/vaga/123')).toBe('http://gupy.io/vaga/123')
  })

  it('handles URLs with query parameters', () => {
    expect(extractUrl('Link: https://indeed.com/viewjob?jk=abc&tk=xyz')).toBe(
      'https://indeed.com/viewjob?jk=abc&tk=xyz'
    )
  })
})

describe('isJobPostingUrl', () => {
  it('recognizes LinkedIn job URLs', () => {
    expect(isJobPostingUrl('https://www.linkedin.com/jobs/view/12345')).toBe(true)
  })

  it('recognizes LinkedIn profile URLs (sometimes used for job posts)', () => {
    expect(isJobPostingUrl('https://www.linkedin.com/in/company-jobs')).toBe(true)
  })

  it('recognizes Gupy URLs', () => {
    expect(isJobPostingUrl('https://empresa.gupy.io/vagas/12345')).toBe(true)
  })

  it('recognizes Catho URLs', () => {
    expect(isJobPostingUrl('https://www.catho.com.br/vagas/12345')).toBe(true)
  })

  it('recognizes Indeed URLs', () => {
    expect(isJobPostingUrl('https://www.indeed.com/viewjob?jk=abc')).toBe(true)
  })

  it('recognizes Vagas.com.br URLs', () => {
    expect(isJobPostingUrl('https://www.vagas.com.br/v12345')).toBe(true)
  })

  it('recognizes InfoJobs URLs', () => {
    expect(isJobPostingUrl('https://www.infojobs.com.br/vaga/12345')).toBe(true)
  })

  it('recognizes Glassdoor URLs', () => {
    expect(isJobPostingUrl('https://www.glassdoor.com/job/12345')).toBe(true)
  })

  it('recognizes Lever URLs', () => {
    expect(isJobPostingUrl('https://jobs.lever.co/company/role-id')).toBe(true)
  })

  it('recognizes Greenhouse URLs', () => {
    expect(isJobPostingUrl('https://boards.greenhouse.io/company/jobs/12345')).toBe(true)
  })

  it('rejects unknown URLs', () => {
    expect(isJobPostingUrl('https://www.google.com')).toBe(false)
  })

  it('rejects social media URLs', () => {
    expect(isJobPostingUrl('https://www.facebook.com/page')).toBe(false)
    expect(isJobPostingUrl('https://twitter.com/user')).toBe(false)
  })

  it('rejects internal/localhost URLs', () => {
    expect(isJobPostingUrl('http://localhost:3000/admin')).toBe(false)
    expect(isJobPostingUrl('http://127.0.0.1/api')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isJobPostingUrl('HTTPS://WWW.LINKEDIN.COM/JOBS/VIEW/123')).toBe(true)
  })
})
