// Configuration for programmatic SEO landing pages
// Each role has its own config with specific content optimized for that profession

export type RoleKeyword = {
  term: string
  description: string
}

export type BeforeAfterExample = {
  before: {
    title: string
    bullets: string[]
  }
  after: {
    title: string
    bullets: string[]
  }
}

export type RoleFaq = {
  question: string
  answer: string
}

export type RoleLandingConfig = {
  slug: string
  role: string
  roleShort: string
  
  // SEO metadata
  meta: {
    title: string
    description: string
    canonical: string
  }
  
  // Hero section
  hero: {
    h1: string
    subtitle: string
    ctaText: string
  }
  
  // Problem section
  problem: {
    title: string
    description: string
    points: string[]
  }
  
  // ATS explanation for this role
  atsExplanation: {
    title: string
    description: string
    whatRecruitersScan: string[]
  }
  
  // Keywords section (SEO gold)
  keywords: RoleKeyword[]
  
  // Before/After CV example
  cvExample: BeforeAfterExample
  
  // How to improve steps
  improvementSteps: {
    title: string
    description: string
  }[]
  
  // FAQs
  faqs: RoleFaq[]
}

// Developer (Desenvolvedor) configuration
export const desenvolvedorConfig: RoleLandingConfig = {
  slug: "curriculo-desenvolvedor-ats",
  role: "Desenvolvedor de Software",
  roleShort: "Desenvolvedor",
  
  meta: {
    title: "Currículo para Desenvolvedor que Passa no ATS (Guia + Exemplo) | CurrIA",
    description: "Aprenda como criar um currículo de desenvolvedor otimizado para ATS. Palavras-chave essenciais, exemplos práticos e dicas para passar nos filtros automáticos.",
    canonical: "/curriculo-desenvolvedor-ats",
  },
  
  hero: {
    h1: "Currículo para Desenvolvedor que Passa no ATS (Guia + Exemplo)",
    subtitle: "Seu currículo de desenvolvedor pode estar sendo rejeitado antes de ser lido. 75% dos currículos são descartados por robôs. Veja como otimizar para sistemas ATS e aumentar suas chances de entrevista.",
    ctaText: "Analisar meu currículo grátis",
  },
  
  problem: {
    title: "Por que currículos de desenvolvedores são rejeitados pelo ATS?",
    description: "Mesmo desenvolvedores experientes cometem erros que fazem seus currículos serem descartados automaticamente.",
    points: [
      "Usar termos genéricos como 'programação' em vez de tecnologias específicas (React, Node.js, Python)",
      "Listar tecnologias sem contexto de aplicação ou resultados mensuráveis",
      "Formato visual com colunas ou tabelas que confundem o parser do ATS",
      "Omitir palavras-chave exatas da descrição da vaga",
      "Colocar habilidades técnicas em formato de ícones ou gráficos",
    ],
  },
  
  atsExplanation: {
    title: "Como o ATS filtra currículos de desenvolvedores",
    description: "Os sistemas ATS para vagas de tecnologia são configurados para buscar correspondências exatas de stack técnico, frameworks e metodologias. Se você escreve 'ReactJS' e a vaga pede 'React', pode perder pontos.",
    whatRecruitersScan: [
      "Stack técnico completo (linguagens, frameworks, bancos de dados)",
      "Experiência com metodologias ágeis (Scrum, Kanban)",
      "Ferramentas de versionamento e CI/CD (Git, GitHub Actions, Jenkins)",
      "Cloud e infraestrutura (AWS, GCP, Azure, Docker, Kubernetes)",
      "Anos de experiência com cada tecnologia principal",
      "Certificações técnicas relevantes",
    ],
  },
  
  keywords: [
    { term: "JavaScript/TypeScript", description: "Linguagens essenciais para desenvolvimento web moderno" },
    { term: "React/Vue/Angular", description: "Frameworks front-end mais requisitados pelo mercado" },
    { term: "Node.js", description: "Runtime JavaScript para back-end, presente em 70% das vagas full-stack" },
    { term: "Python", description: "Linguagem versátil para back-end, automação e data science" },
    { term: "SQL/NoSQL", description: "PostgreSQL, MySQL, MongoDB - bancos de dados são requisitos básicos" },
    { term: "Git/GitHub", description: "Versionamento de código é obrigatório em qualquer vaga" },
    { term: "Docker/Kubernetes", description: "Containerização e orquestração para deploy moderno" },
    { term: "AWS/GCP/Azure", description: "Cloud computing é diferencial competitivo" },
    { term: "REST APIs/GraphQL", description: "Arquitetura de APIs para integração de sistemas" },
    { term: "Scrum/Agile", description: "Metodologias ágeis presentes em praticamente todas as empresas" },
  ],
  
  cvExample: {
    before: {
      title: "Experiência em Desenvolvimento",
      bullets: [
        "Trabalhei com programação web",
        "Desenvolvi sistemas para a empresa",
        "Participei de projetos em equipe",
        "Conhecimento em várias linguagens",
      ],
    },
    after: {
      title: "Desenvolvedor Full Stack | React, Node.js, TypeScript",
      bullets: [
        "Desenvolvi 15+ aplicações web usando React, TypeScript e Node.js, reduzindo tempo de carregamento em 40%",
        "Implementei arquitetura de microsserviços com Docker e AWS, suportando 100k+ usuários ativos",
        "Liderei equipe de 4 desenvolvedores em metodologia Scrum, entregando 95% dos sprints no prazo",
        "Integrei sistemas via REST APIs e GraphQL, processando 1M+ requisições diárias",
      ],
    },
  },
  
  improvementSteps: [
    { title: "Liste suas tecnologias com precisão", description: "Use os nomes exatos das tecnologias (React, não ReactJS; Node.js, não NodeJS). Inclua versões se relevante." },
    { title: "Quantifique seus resultados", description: "Transforme 'melhorei a performance' em 'reduzi o tempo de carregamento em 40%'. Números passam melhor pelos filtros." },
    { title: "Espelhe a descrição da vaga", description: "Se a vaga pede 'experiência com AWS', use exatamente 'AWS' no seu currículo, não apenas 'cloud computing'." },
    { title: "Use formato limpo e parseável", description: "Evite colunas, tabelas e ícones. O ATS lê texto linear. Use bullets simples e seções claras." },
    { title: "Inclua projetos com contexto", description: "Para cada projeto, mencione: tecnologias usadas, seu papel, métricas de resultado." },
    { title: "Adicione certificações", description: "AWS Certified, Google Cloud Professional, ou cursos reconhecidos agregam palavras-chave valiosas." },
  ],
  
  faqs: [
    {
      question: "Quais palavras-chave são essenciais para desenvolvedor?",
      answer: "Depende da stack, mas geralmente: JavaScript/TypeScript, React ou Vue, Node.js ou Python, SQL, Git, Docker, AWS/GCP, REST APIs, e Scrum/Agile são as mais buscadas.",
    },
    {
      question: "Devo listar todas as tecnologias que conheço?",
      answer: "Não. Liste apenas tecnologias que você domina e que são relevantes para a vaga. Currículos com 30+ tecnologias parecem genéricos. Foque nas 10-15 mais importantes.",
    },
    {
      question: "GitHub conta como experiência?",
      answer: "Sim! Projetos open source e contribuições no GitHub são valorizados, especialmente para desenvolvedores júnior. Inclua links para projetos relevantes.",
    },
    {
      question: "Como destacar experiência com tecnologias recentes?",
      answer: "Mencione projetos específicos, mesmo que pessoais. Por exemplo: 'Desenvolvi aplicação usando Next.js 14 e Server Components' mostra que você está atualizado.",
    },
    {
      question: "O ATS diferencia React de ReactJS?",
      answer: "Pode diferenciar sim. Use a nomenclatura oficial e mais comum. 'React' é preferível a 'ReactJS'. 'Node.js' é melhor que 'NodeJS' ou 'Node'.",
    },
    {
      question: "Vale colocar soft skills no currículo técnico?",
      answer: "Sim, mas de forma contextualizada. Em vez de listar 'trabalho em equipe', escreva 'Colaborei com equipe de 5 desenvolvedores em ambiente Scrum'.",
    },
  ],
}

// Data Analyst (Analista de Dados) configuration
export const analistaDadosConfig: RoleLandingConfig = {
  slug: "curriculo-analista-dados-ats",
  role: "Analista de Dados",
  roleShort: "Analista de Dados",
  
  meta: {
    title: "Currículo para Analista de Dados que Passa no ATS (Guia + Exemplo) | CurrIA",
    description: "Crie um currículo de analista de dados otimizado para ATS. Palavras-chave como SQL, Python, Power BI e técnicas para passar nos filtros automáticos.",
    canonical: "/curriculo-analista-dados-ats",
  },
  
  hero: {
    h1: "Currículo para Analista de Dados que Passa no ATS (Guia + Exemplo)",
    subtitle: "Seu currículo de analista de dados pode estar sendo filtrado antes de chegar ao recrutador. Aprenda a otimizar para sistemas ATS e conquiste mais entrevistas na área de dados.",
    ctaText: "Analisar meu currículo grátis",
  },
  
  problem: {
    title: "Por que currículos de analistas de dados são rejeitados pelo ATS?",
    description: "A área de dados exige termos técnicos específicos. Erros comuns fazem currículos excelentes serem descartados.",
    points: [
      "Usar 'análise de dados' genérico em vez de ferramentas específicas (SQL, Python, Power BI)",
      "Não mencionar bibliotecas e frameworks de data science (Pandas, NumPy, Scikit-learn)",
      "Omitir experiência com bancos de dados e data warehouses",
      "Falta de métricas e KPIs nos resultados apresentados",
      "Não incluir experiência com visualização de dados e ferramentas de BI",
    ],
  },
  
  atsExplanation: {
    title: "Como o ATS filtra currículos de analistas de dados",
    description: "Recrutadores de data configuram o ATS para buscar combinações específicas de ferramentas de análise, linguagens de programação e experiência com bancos de dados. A ausência de termos-chave elimina candidatos qualificados.",
    whatRecruitersScan: [
      "Linguagens de análise (SQL, Python, R)",
      "Ferramentas de BI (Power BI, Tableau, Looker, Metabase)",
      "Bibliotecas de data science (Pandas, NumPy, Matplotlib, Seaborn)",
      "Bancos de dados e data warehouses (PostgreSQL, BigQuery, Snowflake, Redshift)",
      "Processos de ETL e pipelines de dados",
      "Experiência com estatística e modelagem",
    ],
  },
  
  keywords: [
    { term: "SQL", description: "Linguagem fundamental para consultas e manipulação de dados em qualquer empresa" },
    { term: "Python", description: "Principal linguagem para análise de dados, automação e machine learning" },
    { term: "Power BI/Tableau", description: "Ferramentas de visualização e dashboards mais requisitadas" },
    { term: "Excel Avançado", description: "Ainda essencial: tabelas dinâmicas, VLOOKUP, macros e Power Query" },
    { term: "Pandas/NumPy", description: "Bibliotecas Python obrigatórias para manipulação e análise de dados" },
    { term: "ETL/Pipeline de Dados", description: "Processos de extração, transformação e carga de dados" },
    { term: "BigQuery/Snowflake", description: "Data warehouses em nuvem cada vez mais requisitados" },
    { term: "Estatística", description: "Análise estatística, testes A/B, regressão e correlação" },
    { term: "Data Visualization", description: "Criação de gráficos, dashboards e storytelling com dados" },
    { term: "Machine Learning", description: "Diferencial: Scikit-learn, modelos preditivos, classificação" },
  ],
  
  cvExample: {
    before: {
      title: "Experiência com Dados",
      bullets: [
        "Analisei dados da empresa",
        "Criei relatórios gerenciais",
        "Trabalhei com planilhas",
        "Ajudei na tomada de decisões",
      ],
    },
    after: {
      title: "Analista de Dados | SQL, Python, Power BI",
      bullets: [
        "Desenvolvi 20+ dashboards em Power BI monitorando KPIs de vendas, reduzindo tempo de reporting em 60%",
        "Automatizei pipeline de ETL com Python e Pandas, processando 5M+ registros diários do data warehouse",
        "Conduzi análises estatísticas e testes A/B que aumentaram conversão em 25% no e-commerce",
        "Criei queries SQL complexas no BigQuery para segmentação de clientes, impactando R$2M em receita",
      ],
    },
  },
  
  improvementSteps: [
    { title: "Especifique suas ferramentas", description: "Liste SQL, Python, Power BI, Tableau com contexto de uso. Evite apenas 'ferramentas de análise'." },
    { title: "Inclua volume de dados", description: "Mencione escala: 'Analisei 1M+ registros' ou 'Processei 500GB de dados mensais' impressiona recrutadores." },
    { title: "Destaque impacto em negócio", description: "Conecte análises a resultados: 'Identificou oportunidade de R$500K em economia' vale mais que 'fez análises'." },
    { title: "Mencione bancos de dados", description: "PostgreSQL, MySQL, BigQuery, Snowflake - especifique onde seus dados vivem." },
    { title: "Inclua visualizações", description: "Dashboards e relatórios são o output. Quantifique: 'Criei 30+ dashboards para 5 áreas de negócio'." },
    { title: "Adicione certificações de dados", description: "Google Data Analytics, Microsoft Power BI, AWS Data Analytics agregam credibilidade." },
  ],
  
  faqs: [
    {
      question: "SQL é realmente obrigatório para analista de dados?",
      answer: "Sim, SQL aparece em 90%+ das vagas de dados. É a base para consultar qualquer banco de dados relacional e é requisito mínimo em praticamente todas as empresas.",
    },
    {
      question: "Preciso saber programar para ser analista de dados?",
      answer: "Depende da vaga, mas Python está cada vez mais requisitado. Para vagas mais avançadas, Python com Pandas é quase obrigatório. Excel avançado ainda é aceito em algumas posições.",
    },
    {
      question: "Power BI ou Tableau: qual colocar no currículo?",
      answer: "Idealmente, ambos. Power BI é mais comum em empresas brasileiras, Tableau em multinacionais. Se conhece apenas um, mencione e adicione 'familiar com [outro]' se tiver noção básica.",
    },
    {
      question: "Devo incluir Excel no currículo de dados?",
      answer: "Sim, mas especifique 'Excel Avançado' com detalhes: tabelas dinâmicas, Power Query, macros VBA, VLOOKUP/INDEX-MATCH. Excel básico não precisa mencionar.",
    },
    {
      question: "Como mostrar experiência sem ter trabalhado com Big Data?",
      answer: "Projetos pessoais contam. Use datasets públicos (Kaggle, governo) e documente: 'Analisei dataset de 100K+ registros de vendas usando Python e Pandas'.",
    },
    {
      question: "Machine Learning é necessário para analista de dados?",
      answer: "Não é obrigatório, mas é um diferencial crescente. Conhecimento básico de Scikit-learn e modelos preditivos te destaca, especialmente para posições sênior.",
    },
  ],
}

// Marketing configuration
export const marketingConfig: RoleLandingConfig = {
  slug: "curriculo-marketing-ats",
  role: "Profissional de Marketing",
  roleShort: "Marketing",
  
  meta: {
    title: "Currículo para Marketing que Passa no ATS (Guia + Exemplo) | CurrIA",
    description: "Otimize seu currículo de marketing para sistemas ATS. Palavras-chave de marketing digital, métricas e exemplos práticos para conquistar mais entrevistas.",
    canonical: "/curriculo-marketing-ats",
  },
  
  hero: {
    h1: "Currículo para Marketing que Passa no ATS (Guia + Exemplo)",
    subtitle: "Seu currículo de marketing pode estar sendo rejeitado automaticamente. Veja como incluir as palavras-chave certas e formatar para passar nos filtros ATS.",
    ctaText: "Analisar meu currículo grátis",
  },
  
  problem: {
    title: "Por que currículos de marketing são rejeitados pelo ATS?",
    description: "Marketing é uma área ampla com muitas especialidades. Currículos genéricos são facilmente filtrados.",
    points: [
      "Usar termos vagos como 'gerenciei redes sociais' sem métricas ou plataformas específicas",
      "Não mencionar ferramentas de marketing digital (Google Ads, Meta Ads, HubSpot)",
      "Omitir métricas de performance: CTR, ROAS, CAC, LTV",
      "Falta de palavras-chave de SEO, growth e automação",
      "Não especificar canais e estratégias utilizadas",
    ],
  },
  
  atsExplanation: {
    title: "Como o ATS filtra currículos de marketing",
    description: "Recrutadores de marketing configuram filtros por especialidade (performance, conteúdo, branding) e ferramentas específicas. Um currículo de growth hacker não deve parecer igual ao de brand manager.",
    whatRecruitersScan: [
      "Ferramentas de ads (Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads)",
      "Plataformas de automação (HubSpot, RD Station, Mailchimp, ActiveCampaign)",
      "Analytics e métricas (Google Analytics, Data Studio, métricas de funil)",
      "Especialidade específica (SEO, performance, conteúdo, CRM, growth)",
      "Budget gerenciado e resultados de campanhas",
      "Certificações de marketing digital",
    ],
  },
  
  keywords: [
    { term: "Google Ads/Meta Ads", description: "Plataformas de mídia paga mais utilizadas no mercado" },
    { term: "SEO/SEM", description: "Otimização para buscadores é requisito em marketing digital" },
    { term: "Google Analytics 4", description: "Ferramenta padrão de análise de tráfego e conversões" },
    { term: "HubSpot/RD Station", description: "Plataformas de automação e inbound marketing" },
    { term: "ROI/ROAS/CAC", description: "Métricas de performance que mostram foco em resultados" },
    { term: "CRM", description: "Gestão de relacionamento: Salesforce, Pipedrive, HubSpot CRM" },
    { term: "Marketing de Conteúdo", description: "Estratégia de conteúdo, blog, copywriting, storytelling" },
    { term: "Growth Hacking", description: "Experimentação e otimização para crescimento acelerado" },
    { term: "E-mail Marketing", description: "Automação, segmentação, nurturing e campanhas de e-mail" },
    { term: "Social Media", description: "Gestão de redes: Instagram, LinkedIn, TikTok, estratégia de conteúdo" },
  ],
  
  cvExample: {
    before: {
      title: "Experiência em Marketing",
      bullets: [
        "Gerenciei redes sociais da empresa",
        "Criei campanhas de marketing",
        "Trabalhei com e-mail marketing",
        "Ajudei no crescimento da marca",
      ],
    },
    after: {
      title: "Analista de Marketing Digital | Performance, SEO, Automação",
      bullets: [
        "Gerenciei R$500K/mês em Google Ads e Meta Ads, alcançando ROAS de 4.5x e reduzindo CAC em 30%",
        "Implementei estratégia de SEO que aumentou tráfego orgânico em 150% em 6 meses (50K para 125K visitas)",
        "Estruturei automação de marketing no HubSpot com 15 fluxos de nurturing, aumentando conversão em 40%",
        "Liderei equipe de 3 pessoas em campanhas integradas, gerando 2.000+ leads qualificados/mês",
      ],
    },
  },
  
  improvementSteps: [
    { title: "Especifique suas plataformas", description: "Google Ads, Meta Ads, LinkedIn Ads - nomeie cada ferramenta. Evite apenas 'mídia paga'." },
    { title: "Inclua métricas de resultado", description: "CTR, ROAS, CAC, conversão - números provam seu impacto. 'Aumentei vendas em 50%' é melhor que 'melhorei vendas'." },
    { title: "Mencione budget gerenciado", description: "Gerenciar R$10K/mês é diferente de R$500K/mês. Contextualize o tamanho da operação." },
    { title: "Destaque sua especialidade", description: "Performance, conteúdo, branding, growth - deixe claro seu foco principal." },
    { title: "Inclua certificações", description: "Google Ads, Meta Blueprint, HubSpot, RD Station - certificações validam conhecimento técnico." },
    { title: "Mostre conhecimento de funil", description: "Mencione topo, meio e fundo de funil. Entender a jornada do cliente é valorizado." },
  ],
  
  faqs: [
    {
      question: "Quais métricas devo incluir no currículo de marketing?",
      answer: "ROI, ROAS, CTR, CAC, LTV, taxa de conversão, crescimento de tráfego, leads gerados. Escolha as mais relevantes para sua especialidade e quantifique resultados.",
    },
    {
      question: "Marketing tradicional ainda vale no currículo?",
      answer: "Depende da vaga. Para posições de brand ou trade marketing, sim. Para marketing digital puro, foque nas habilidades digitais mas mencione experiência offline se relevante.",
    },
    {
      question: "Devo me especializar ou ser generalista?",
      answer: "Para vagas júnior/pleno, conhecimento amplo é aceito. Para sênior, especialização (SEO, performance, growth) é mais valorizada. Destaque seu diferencial.",
    },
    {
      question: "Google Analytics 4 é diferente do Universal Analytics?",
      answer: "Sim, e recrutadores notam. GA4 é o atual padrão. Se você só conhece o antigo, mencione 'Google Analytics' e busque atualização em GA4.",
    },
    {
      question: "Como mostrar experiência com budget pequeno?",
      answer: "Foque em porcentagem de melhoria e eficiência: 'Otimizei campanha de R$5K/mês alcançando ROAS 5x' mostra competência independente do volume.",
    },
    {
      question: "Certificações de marketing realmente importam?",
      answer: "Sim, especialmente para quem está migrando de área ou em início de carreira. Google Ads, Meta Blueprint e HubSpot são as mais reconhecidas.",
    },
  ],
}

// Export all configs as a map for easy lookup
export const roleLandingConfigs: Record<string, RoleLandingConfig> = {
  "curriculo-desenvolvedor-ats": desenvolvedorConfig,
  "curriculo-analista-dados-ats": analistaDadosConfig,
  "curriculo-marketing-ats": marketingConfig,
}

// Helper to get config by slug
export function getRoleLandingConfig(slug: string): RoleLandingConfig | undefined {
  return roleLandingConfigs[slug]
}

// Get all slugs for static generation
export function getAllRoleSlugs(): string[] {
  return Object.keys(roleLandingConfigs)
}
