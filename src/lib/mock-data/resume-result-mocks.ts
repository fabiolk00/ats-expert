import type { CVState } from "@/types/cv"

/**
 * Mock data para testes e demonstração dos componentes de resultado de resume
 */

export const mockOptimizedResume: CVState = {
  fullName: "João Silva",
  email: "joao.silva@email.com",
  phone: "+55 (11) 99999-9999",
  location: "São Paulo, SP",
  linkedin: "linkedin.com/in/joao-silva",
  summary:
    "Engenheiro de Software Sênior com 8+ anos de experiência desenvolvendo soluções escaláveis em React, TypeScript e AWS. Liderança técnica comprovada com expertise em arquitetura de microsserviços, CI/CD e gerenciamento de equipes de até 12 pessoas. Apaixonado por código limpo, boas práticas e mentoria de desenvolvedores juniores.",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Company Brasil",
      location: "São Paulo, SP",
      startDate: "Mar 2021",
      endDate: "present",
      bullets: [
        "Liderou redesign de arquitetura de microsserviços, reduzindo tempo de deploy em 60%",
        "Implementou pipeline CI/CD com GitHub Actions e AWS, aumentando produtividade em 45%",
        "Mentorou 5 desenvolvedores juniores, promovendo 2 a positions de mid-level",
        "Otimizou performance de aplicação React, reduzindo bundle size em 40%",
      ],
    },
    {
      title: "Full Stack Developer",
      company: "Startup Tech",
      location: "São Paulo, SP",
      startDate: "Jan 2019",
      endDate: "Feb 2021",
      bullets: [
        "Desenvolveu plataforma SaaS com React e Node.js para 500+ usuários",
        "Implementou integração com AWS Lambda e DynamoDB",
        "Colaborou com product team para definir roadmap técnico",
      ],
    },
    {
      title: "Junior Developer",
      company: "Web Solutions",
      location: "São Paulo, SP",
      startDate: "Jul 2017",
      endDate: "Dec 2018",
      bullets: [
        "Desenvolveu componentes React reutilizáveis",
        "Aprendizado em desenvolvimento full-stack com JavaScript",
      ],
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "AWS",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "PostgreSQL",
    "MongoDB",
    "Git",
    "CI/CD",
    "Microserviços",
    "Jest",
    "TailwindCSS",
    "Leadership",
  ],
  education: [
    {
      degree: "Bacharelado em Ciência da Computação",
      institution: "Universidade de São Paulo (USP)",
      year: "2017",
      gpa: "3.8",
    },
    {
      degree: "Curso de Pós-Graduação em Arquitetura de Software",
      institution: "Alura",
      year: "2020",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect - Professional",
      issuer: "Amazon Web Services",
      year: "2022",
    },
    {
      name: "Docker Certified Associate",
      issuer: "Docker",
      year: "2021",
    },
  ],
}

export const mockOriginalResume: CVState = {
  fullName: "João Silva",
  email: "joao.silva@email.com",
  phone: "+55 (11) 99999-9999",
  location: "São Paulo, SP",
  linkedin: "linkedin.com/in/joao-silva",
  summary: "Desenvolvedor com experiência em React e Node.js. Trabalhei em várias startups.",
  experience: [
    {
      title: "Desenvolvedor",
      company: "Tech Company Brasil",
      startDate: "2021",
      endDate: "present",
      bullets: [
        "Desenvolvi componentes React",
        "Trabalhei com backend em Node.js",
        "Participei de reuniões de produto",
      ],
    },
    {
      title: "Desenvolvedor",
      company: "Startup Tech",
      startDate: "2019",
      endDate: "2021",
      bullets: ["Fiz uma plataforma com React", "Trabalhei com banco de dados"],
    },
    {
      title: "Desenvolvedor Júnior",
      company: "Web Solutions",
      startDate: "2017",
      endDate: "2018",
      bullets: ["Aprendizado em React", "Desenvolvimento web"],
    },
  ],
  skills: ["React", "JavaScript", "Node.js", "HTML", "CSS", "Git", "PostgreSQL"],
  education: [
    {
      degree: "Bacharelado em Ciência da Computação",
      institution: "Universidade de São Paulo (USP)",
      year: "2017",
    },
  ],
  certifications: [],
}

export const mockJobDescription = `Buscamos um Engenheiro de Software Sênior com:
- 7+ anos de experiência em desenvolvimento full-stack
- Expertise em React, TypeScript e Node.js
- Experiência comprovada com AWS
- Conhecimento em CI/CD e DevOps
- Liderança técnica e mentoría
- Experiência com arquitetura de microsserviços
- Conhecimento em testes automatizados`

/**
 * Resumo de alterações para exemplo
 */
export const mockChangesSummary = {
  summaryChanges:
    "Reformulado para destacar experiência em leadership e tecnologias específicas da vaga",
  experienceChanges:
    "Reescrita com ênfase em métricas e resultados mensuráveis",
  skillsAdded: [
    "TypeScript",
    "AWS",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "Microserviços",
    "CI/CD",
  ],
  skillsRemoved: ["HTML", "CSS"],
}

/**
 * Alertas de atenção para exemplo
 */
export const mockAttentionPoints = [
  {
    severity: "warning" as const,
    title: "Afirmação sem comprovação",
    description:
      'Você mencionou "liderança de equipes de 50+ pessoas" mas não forneceu evidências em seu currículo.',
    suggestion:
      "Adicione informações de posições de liderança anteriores com detalhes de tamanho das equipes.",
  },
  {
    severity: "error" as const,
    title: "Mismatch de senioridade",
    description:
      "A vaga requer 8 anos de experiência, você tem 5 anos documentados.",
    suggestion:
      "Destaque projetos mais desafiadores ou independentes em suas experiências anteriores.",
  },
]

/**
 * Requisitos da vaga cobertos
 */
export const mockCoveredRequirements = [
  "React e TypeScript",
  "Experiência com AWS",
  "Conhecimento em CI/CD",
  "Liderança de projetos",
]

/**
 * Lacunas não preenchidas
 */
export const mockGaps = [
  "Machine Learning (não presente no seu currículo)",
  "Gestão de produto (fora do escopo)",
]
