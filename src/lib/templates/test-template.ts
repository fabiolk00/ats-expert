import { generateDOCX } from '../agent/tools/generate-file'
import { writeFileSync } from 'fs'
import type { CVState } from '../../types/cv'

const testCV: CVState = {
  fullName: 'João Silva',
  email: 'joao@email.com',
  phone: '11 99999-9999',
  linkedin: 'linkedin.com/in/joaosilva',
  location: 'São Paulo, SP',
  summary: 'Desenvolvedor com 5 anos de experiência em React e Node.js.',
  experience: [
    {
      title: 'Senior Frontend Engineer',
      company: 'Acme Corp',
      startDate: 'Jan 2021',
      endDate: 'present',
      bullets: [
        'Led migration to React 18, reducing bundle size by 40%',
        'Mentored 3 junior developers across 2 teams',
      ],
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'],
  education: [{ degree: 'B.Sc. Ciência da Computação', institution: 'USP', year: '2018' }],
  certifications: [{ name: 'AWS Solutions Architect', issuer: 'Amazon', year: '2022' }],
}

async function main() {
  const buffer = await generateDOCX(testCV)
  writeFileSync('test-output.docx', buffer)
  console.log('✓ test-output.docx written — open to verify layout')
}

main().catch(console.error)
