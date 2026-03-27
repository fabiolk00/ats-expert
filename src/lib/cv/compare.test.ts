import { describe, expect, it } from 'vitest'

import { compareCVStates } from '@/lib/cv/compare'
import type { CVState } from '@/types/cv'

function buildBaseCVState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    linkedin: 'linkedin.com/in/anasilva',
    location: 'Sao Paulo',
    summary: 'Backend engineer focused on APIs.',
    experience: [{
      title: 'Software Engineer',
      company: 'Acme',
      location: 'Remote',
      startDate: '2022-01',
      endDate: 'present',
      bullets: ['Built APIs', 'Improved latency'],
    }],
    skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
    education: [{
      degree: 'BSc Computer Science',
      institution: 'USP',
      year: '2021',
    }],
    certifications: [{
      name: 'AWS Practitioner',
      issuer: 'AWS',
      year: '2024',
    }],
  }
}

describe('compareCVStates', () => {
  it('returns a structured diff by section', () => {
    const before = buildBaseCVState()
    const after: CVState = {
      ...before,
      summary: 'Backend engineer focused on APIs and AWS roles.',
      skills: ['TypeScript', 'Node.js', 'AWS'],
      experience: [{
        ...before.experience[0],
        bullets: ['Built APIs', 'Reduced latency by 40%'],
      }],
      education: [
        ...before.education,
        {
          degree: 'MBA',
          institution: 'FGV',
          year: '2025',
        },
      ],
      certifications: [],
    }

    expect(compareCVStates(before, after)).toEqual({
      summary: {
        before: 'Backend engineer focused on APIs.',
        after: 'Backend engineer focused on APIs and AWS roles.',
        changed: true,
      },
      skills: {
        added: ['AWS'],
        removed: ['PostgreSQL'],
        unchangedCount: 2,
      },
      experience: {
        added: [],
        removed: [],
        changed: [{
          before: before.experience[0],
          after: after.experience[0],
        }],
        unchangedCount: 0,
      },
      education: {
        added: [{
          degree: 'MBA',
          institution: 'FGV',
          year: '2025',
        }],
        removed: [],
        changed: [],
        unchangedCount: 1,
      },
      certifications: {
        added: [],
        removed: [{
          name: 'AWS Practitioner',
          issuer: 'AWS',
          year: '2024',
        }],
        changed: [],
        unchangedCount: 0,
      },
    })
  })

  it('omits unchanged sections', () => {
    const before = buildBaseCVState()
    const after = {
      ...before,
      summary: 'Backend engineer focused on platform work.',
    }

    expect(compareCVStates(before, after)).toEqual({
      summary: {
        before: 'Backend engineer focused on APIs.',
        after: 'Backend engineer focused on platform work.',
        changed: true,
      },
    })
  })
})
