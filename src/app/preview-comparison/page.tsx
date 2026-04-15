"use client"

import { ResumeComparisonView } from "@/components/resume/resume-comparison-view"
import type { CVState } from "@/types/cv"

// Mock data para preview
const mockOriginalCvState: CVState = {
  fullName: "Joao Silva",
  email: "joao.silva@email.com",
  phone: "(11) 99999-9999",
  location: "Sao Paulo, SP",
  linkedin: "linkedin.com/in/joaosilva",
  summary:
    "Desenvolvedor com experiencia em projetos web. Trabalho com tecnologias modernas e gosto de aprender coisas novas. Busco oportunidades para crescer na carreira.",
  experience: [
    {
      id: "exp1",
      company: "Tech Company",
      title: "Desenvolvedor",
      startDate: "Jan 2022",
      endDate: "Jan 2024",
      location: "Sao Paulo, SP",
      bullets: [
        "Trabalhei em projetos de desenvolvimento web",
        "Participei de reunioes com o time",
        "Ajudei a resolver bugs no sistema",
      ],
    },
    {
      id: "exp2",
      company: "Startup XYZ",
      title: "Estagiario",
      startDate: "Jan 2021",
      endDate: "Dez 2021",
      location: "Sao Paulo, SP",
      bullets: [
        "Aprendi sobre desenvolvimento de software",
        "Ajudei em tarefas do dia a dia",
      ],
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "Universidade de Sao Paulo",
      degree: "Bacharelado em Ciencia da Computacao",
      year: "2022",
    },
  ],
  skills: ["JavaScript", "React", "Node.js", "HTML", "CSS"],
  certifications: [],
}

const mockOptimizedCvState: CVState = {
  fullName: "Joao Silva",
  email: "joao.silva@email.com",
  phone: "(11) 99999-9999",
  location: "Sao Paulo, SP",
  linkedin: "linkedin.com/in/joaosilva",
  summary:
    "Desenvolvedor Full Stack com 3+ anos de experiencia em desenvolvimento de aplicacoes web escalaveis utilizando React, Node.js e TypeScript. Historico comprovado de entrega de projetos de alta qualidade em ambientes ageis, com foco em performance e experiencia do usuario.",
  experience: [
    {
      id: "exp1",
      company: "Tech Company",
      title: "Desenvolvedor Full Stack",
      startDate: "Jan 2022",
      endDate: "Jan 2024",
      location: "Sao Paulo, SP",
      bullets: [
        "Desenvolvi e mantive 5+ aplicacoes web utilizando React e Node.js, resultando em 40% de melhoria na performance",
        "Colaborei com equipes multidisciplinares de 8 pessoas em sprints ageis, entregando 100% das features no prazo",
        "Reduzi o tempo de resolucao de bugs em 60% atraves da implementacao de testes automatizados e CI/CD",
      ],
    },
    {
      id: "exp2",
      company: "Startup XYZ",
      title: "Desenvolvedor Junior",
      startDate: "Jan 2021",
      endDate: "Dez 2021",
      location: "Sao Paulo, SP",
      bullets: [
        "Participei do desenvolvimento de MVP que conquistou 1000+ usuarios no primeiro mes",
        "Implementei funcionalidades de frontend utilizando React e TypeScript",
      ],
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "Universidade de Sao Paulo",
      degree: "Bacharelado em Ciencia da Computacao",
      year: "2022",
    },
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "Git",
    "CI/CD",
  ],
  certifications: [],
}

export default function PreviewComparisonPage() {
  const handleContinue = () => {
    alert("Voce seria redirecionado para o dashboard!")
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
