import { describe, expect, it } from 'vitest'

import { mapLinkdAPIToCvState } from './linkdapi'

describe('mapLinkdAPIToCvState', () => {
  it('maps the current LinkdAPI profile/full response shape into cvState', () => {
    const result = mapLinkdAPIToCvState({
      firstName: 'Fabio',
      lastName: 'Kroker',
      username: 'fabio-kroker',
      phone: '+55 41 99999-0000',
      geo: {
        full: 'Curitiba, Paraná, Brazil',
      },
      summary: 'Resumo profissional',
      position: [
        {
          title: 'Senior Business Intelligence',
          companyName: 'CNH',
          location: 'Куритиба, PR',
          description: 'Primeira linha\nSegunda linha',
          start: { year: 2025, month: 1 },
          end: { year: 0, month: 0 },
        },
      ],
      educations: [
        {
          schoolName: 'UniCesumar',
          degree: 'Graduação',
          field: 'ADS',
          end: { year: 2026, month: 12 },
        },
      ],
      skills: [{ name: 'SQL' }, 'Power BI'],
      certifications: [
        {
          name: 'Databricks Fundamentals',
          authority: 'Databricks',
          start: { year: 2025, month: 8 },
        },
      ],
    })

    expect(result.fullName).toBe('Fabio Kroker')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/fabio-kroker/')
    expect(result.location).toBe('Curitiba, Paraná, Brazil')
    expect(result.phone).toBe('+55 41 99999-0000')
    expect(result.experience).toEqual([
      expect.objectContaining({
        title: 'Senior Business Intelligence',
        company: 'CNH',
        location: 'Curitiba, PR',
        startDate: '01/2025',
        bullets: ['Primeira linha', 'Segunda linha'],
      }),
    ])
    expect(result.education).toEqual([
      expect.objectContaining({
        degree: 'Graduação - ADS',
        institution: 'UniCesumar',
        year: '12/2026',
      }),
    ])
    expect(result.skills).toEqual(['SQL', 'Power BI'])
    expect(result.certifications).toEqual([
      expect.objectContaining({
        name: 'Databricks Fundamentals',
        issuer: 'Databricks',
        year: '08/2025',
      }),
    ])
  })

  it('still supports the older response field names', () => {
    const result = mapLinkdAPIToCvState({
      fullName: 'Ana Silva',
      profileUrl: 'https://www.linkedin.com/in/ana-silva/',
      location: { full: 'São Paulo, Brazil' },
      summary: 'Resumo',
      experience: [
        {
          title: 'Backend Engineer',
          company: 'Acme',
          startDate: '2023',
          endDate: 'present',
          description: 'Item único',
        },
      ],
      education: [
        {
          school: 'USP',
          degree: 'Bacharelado',
          endDate: '2022',
        },
      ],
      skills: ['Node.js'],
    })

    expect(result.fullName).toBe('Ana Silva')
    expect(result.linkedin).toBe('https://www.linkedin.com/in/ana-silva/')
    expect(result.experience[0]).toEqual(
      expect.objectContaining({
        title: 'Backend Engineer',
        company: 'Acme',
        endDate: 'present',
      }),
    )
    expect(result.education[0]).toEqual(
      expect.objectContaining({
        institution: 'USP',
        year: '2022',
      }),
    )
  })
})
