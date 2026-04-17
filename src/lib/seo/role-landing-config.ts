// ... existing content remains unchanged above

export const engenheiroDadosConfig: RoleLandingConfig = {
  slug: "curriculo-engenheiro-de-dados-ats",
  role: "Engenheiro de Dados",
  roleShort: "Eng. de Dados",

  meta: {
    title: "Currículo para Engenheiro de Dados que Passa no ATS (Guia e Exemplo) | CurrIA",
    description: "Aprenda como criar um currículo de engenheiro de dados otimizado para ATS com exemplos de pipelines, ETL, Spark e cloud.",
    canonical: "/curriculo-engenheiro-de-dados-ats",
  },

  hero: {
    h1: "Currículo para Engenheiro de Dados que Passa no ATS",
    subtitle: "Você constrói pipelines e infra de dados, mas seu currículo pode não refletir isso. ATS procura stack técnica, volume e arquitetura.",
    ctaText: "Veja seu score ATS",
    ctaSubtext: "Analise seu currículo gratuitamente",
  },

  problem: {
    title: "Por que currículos de engenheiro de dados são rejeitados?",
    description: "Falta de clareza técnica e impacto em escala são os principais problemas.",
    points: [
      "Não mencionar volume de dados",
      "Descrever ETL sem ferramentas",
      "Falta de cloud (AWS/GCP)",
      "Não mostrar pipelines reais",
      "Falta de impacto técnico",
    ],
  },

  atsExplanation: {
    title: "Como o ATS avalia engenheiros de dados",
    description: "ATS busca stack, escala e arquitetura.",
    whatRecruitersScan: [
      "Spark / Databricks",
      "ETL pipelines",
      "Cloud (AWS/GCP)",
      "SQL avançado",
      "Big Data",
    ],
  },

  keywords: [
    { term: "Spark", description: "Processamento distribuído" },
    { term: "ETL", description: "Pipelines de dados" },
    { term: "Databricks", description: "Plataforma moderna" },
    { term: "AWS/GCP", description: "Cloud" },
  ],

  commonMistakes: [
    { mistake: "Sem escala", fix: "Inclua volume de dados" },
    { mistake: "Sem ferramentas", fix: "Liste stack" },
  ],

  resumeSections: {
    summary: {
      title: "Resumo",
      bad: "Engenheiro de dados",
      good: "Engenheiro de dados com pipelines de 10TB/dia",
    },
    skills: {
      title: "Skills",
      bad: "SQL, Python",
      good: "SQL avançado, Spark, Airflow, GCP",
    },
    experience: {
      title: "Experiência",
      bad: "Trabalhei com dados",
      good: "Construí pipeline com Spark processando 5TB/dia",
    },
  },

  specializations: [
    {
      title: "Big Data",
      description: "Escala massiva",
      keywords: ["Spark", "Hadoop"],
    },
  ],

  seniorityLevels: [
    { level: "Júnior", focus: "Aprendizado", tips: ["Projetos"] },
    { level: "Pleno", focus: "Escala", tips: ["Impacto"] },
    { level: "Sênior", focus: "Arquitetura", tips: ["Design"] },
  ],

  cvExample: {
    before: { title: "Experiência", bullets: ["Dados"] },
    after: { title: "Data Engineer", bullets: ["Pipeline 5TB/dia"] },
  },

  fullResumeExample: {
    name: "Data Engineer",
    title: "Engenheiro de Dados",
    contact: "email",
    summary: "Experiência em dados",
    skills: [{ category: "Data", items: "Spark" }],
    experience: [{ role: "Eng", company: "Empresa", period: "2022", bullets: ["ETL"] }],
    education: { degree: "TI", institution: "Uni", year: "2020" },
    certifications: ["Cloud"],
  },

  improvementSteps: [
    { title: "Mostre escala", description: "Volume de dados" },
  ],

  internalLinks: [
    { label: "Analista de Dados", href: "/curriculo-analista-dados-ats", description: "dados", image: "" },
  ],

  faqs: [
    { question: "O que colocar?", answer: "Stack e escala" },
  ],
}

// update registry
export function getRoleLandingConfigBySlug(slug: string): RoleLandingConfig | undefined {
  const configs: Record<string, RoleLandingConfig> = {
    "curriculo-desenvolvedor-ats": desenvolvedorConfig,
    "curriculo-analista-dados-ats": analistaDadosConfig,
    "curriculo-marketing-ats": marketingConfig,
    "curriculo-customer-success-ats": customerSuccessConfig,
    "curriculo-product-manager-ats": productManagerConfig,
    "curriculo-vendas-ats": vendasConfig,
    "curriculo-financeiro-ats": financeiroConfig,
    "curriculo-engenheiro-de-dados-ats": engenheiroDadosConfig,
  }
  return configs[slug]
}

export const allRoleLandingConfigs: RoleLandingConfig[] = [
  desenvolvedorConfig,
  analistaDadosConfig,
  marketingConfig,
  customerSuccessConfig,
  productManagerConfig,
  vendasConfig,
  financeiroConfig,
  engenheiroDadosConfig,
]
