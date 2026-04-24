import { describe, expect, it } from 'vitest'

import { collectMojibakeIssues, isAppPageFile } from './copy-audit.mjs'

describe('collectMojibakeIssues', () => {
  it('flags common double-encoded pt-BR copy on a single line', () => {
    const text = [
      'Curr\u00C3\u0192\u00C2\u00ADculos com scores baixos s\u00C3\u0192\u00C2\u00A3o arquivados.',
      'A Configura\u00C3\u0192\u00C2\u00A7\u00C3\u0192\u00C2\u00A3o do ATS falhou.',
    ].join('\n')

    expect(collectMojibakeIssues('src/components/landing/example.tsx', text)).toEqual([
      {
        filePath: 'src/components/landing/example.tsx',
        line: 1,
        type: 'mojibake',
        excerpt: 'Curr\u00C3\u0192\u00C2\u00ADculos com scores baixos s\u00C3\u0192\u00C2\u00A3o arquivados.',
      },
      {
        filePath: 'src/components/landing/example.tsx',
        line: 2,
        type: 'mojibake',
        excerpt: 'A Configura\u00C3\u0192\u00C2\u00A7\u00C3\u0192\u00C2\u00A3o do ATS falhou.',
      },
    ])
  })

  it('flags Windows-1252 mojibake for punctuation and astral characters', () => {
    const text = [
      'Texto com travess\u00E2\u20AC\u201D o quebrado.',
      'Emoji corrompido: \u00F0\u0178\u2122\u201A',
    ].join('\n')

    expect(collectMojibakeIssues('src/components/landing/example.tsx', text)).toEqual([
      {
        filePath: 'src/components/landing/example.tsx',
        line: 1,
        type: 'mojibake',
        excerpt: 'Texto com travess\u00E2\u20AC\u201D o quebrado.',
      },
      {
        filePath: 'src/components/landing/example.tsx',
        line: 2,
        type: 'mojibake',
        excerpt: 'Emoji corrompido: \u00F0\u0178\u2122\u201A',
      },
    ])
  })

  it('does not flag valid pt-BR accents or legitimate uppercase Ã', () => {
    const text = [
      'Curr\u00EDculos com scores baixos s\u00E3o arquivados.',
      'A Configura\u00E7\u00E3o do ATS falhou.',
      'FORMA\u00C7\u00C3O ACAD\u00CAMICA',
      'N\u00E3o escreva \u00E0 m\u00E3o.',
    ].join('\n')

    expect(collectMojibakeIssues('src/components/landing/example.tsx', text)).toEqual([])
  })

  it('flags replacement characters as mojibake', () => {
    const text = 'Texto com caractere corrompido: \uFFFD'

    expect(collectMojibakeIssues('src/components/landing/example.tsx', text)).toEqual([
      {
        filePath: 'src/components/landing/example.tsx',
        line: 1,
        type: 'mojibake',
        excerpt: 'Texto com caractere corrompido: \uFFFD',
      },
    ])
  })
})

describe('isAppPageFile', () => {
  it('matches real route pages only', () => {
    expect(isAppPageFile('src/app/(public)/o-que-e-ats/page.tsx')).toBe(true)
    expect(isAppPageFile('src/app/api/session/route.ts')).toBe(false)
    expect(isAppPageFile('src/components/landing/o-que-e-ats-page.tsx')).toBe(false)
  })
})
