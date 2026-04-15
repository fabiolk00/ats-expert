"use client"

import { ResumeComparisonView } from "@/components/resume/resume-comparison-view"
import type { CVState } from "@/types/cv"

// Mock data para preview
const mockOriginalCvState: CVState = {
  contact: {
    fullName: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    location: "São Paulo, SP",
    linkedin: "linkedin.com/in/joaosilva",
  },
  summary:
    "Desenvolvedor com experiência em projetos web. Trabalho com tecnologias modernas e gosto de aprender coisas novas. Busco oportunidades para crescer na carreira.",
  experience: [
    {
      id: "exp1",
      company: "Tech Company",
      title: "Desenvolvedor",
      startDate: "2022-01",
      endDate: "2024-01",
      location: "São Paulo, SP",
      bullets: [
        "Trabalhei em projetos de desenvolvimento web",
        "Participei de reuniões com o time",
        "Ajudei a resolver bugs no sistema",
      ],
    },
    {
      id: "exp2",
      company: "Startup XYZ",
      title: "Estagiário",
      startDate: "2021-01",
      endDate: "2021-12",
      location: "São Paulo, SP",
      bullets: [
        "Aprendi sobre desenvolvimento de software",
        "Ajudei em tarefas do dia a dia",
      ],
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "Universidade de São Paulo",
      degree: "Bacharelado em Ciência da Computação",
      startDate: "2018",
      endDate: "2022",
      location: "São Paulo, SP",
    },
  ],
  skills: ["JavaScript", "React", "Node.js", "HTML", "CSS"],
  certifications: [],
  projects: [],
  languages: [{ language: "Português", proficiency: "Nativo" }],
}

const mockOptimizedCvState: CVState = {
  contact: {
    fullName: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    location: "São Paulo, SP",
    linkedin: "linkedin.com/in/joaosilva",
  },
  summary:
    "Desenvolvedor Full Stack com 3+ anos de experiência em desenvolvimento de aplicações web escaláveis utilizando React, Node.js e TypeScript. Histórico comprovado de entrega de projetos de alta qualidade em ambientes ágeis, com foco em performance e experiência do usuário. Proficiente em metodologias ágeis e práticas de código limpo.",
  experience: [
    {
      id: "exp1",
      company: "Tech Company",
      title: "Desenvolvedor Full Stack",
      startDate: "2022-01",
      endDate: "2024-01",
      location: "São Paulo, SP",
      bullets: [
        "Desenvolvi e mantive 5+ aplicações web utilizando React e Node.js, resultando em 40% de melhoria na performance",
        "Colaborei com equipes multidisciplinares de 8 pessoas em sprints ágeis, entregando 100% das features no prazo",
        "Reduzi o tempo de resolução de bugs em 60% através da implementação de testes automatizados e CI/CD",
        "Mentorei 2 desenvolvedores júnior, acelerando sua integração ao time em 50%",
      ],
    },
    {
      id: "exp2",
      company: "Startup XYZ",
      title: "Desenvolvedor Júnior",
      startDate: "2021-01",
      endDate: "2021-12",
      location: "São Paulo, SP",
      bullets: [
        "Participei do desenvolvimento de MVP que conquistou 1000+ usuários no primeiro mês",
        "Implementei funcionalidades de frontend utilizando React e TypeScript",
        "Contribuí com documentação técnica utilizada pela equipe de 5 desenvolvedores",
      ],
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "Universidade de São Paulo",
      degree: "Bacharelado em Ciência da Computação",
      startDate: "2018",
      endDate: "2022",
      location: "São Paulo, SP",
    },
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "PostgreSQL",
    "MongoDB",
    "Git",
    "CI/CD",
    "Testes Automatizados",
    "Metodologias Ágeis",
  ],
  certifications: [],
  projects: [],
  languages: [
    { language: "Português", proficiency: "Nativo" },
    { language: "Inglês", proficiency: "Avançado" },
  ],
}

export default function PreviewComparisonPage() {
  const handleContinue = () => {
    alert("Você seria redirecionado para o dashboard!")
  }

  return (
    <ResumeComparisonView
      originalCvState={mockOriginalCvState}
      optimizedCvState={mockOptimizedCvState}
      generationType="ATS_ENHANCEMENT"
      onContinue={handleContinue}
    />
  )
}
