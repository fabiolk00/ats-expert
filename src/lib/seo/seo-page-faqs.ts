import type { SeoFaqItem } from "@/lib/seo/json-ld"

export const developerSeoFaqItems = [
  {
    question: "Devo incluir um link para o meu GitHub?",
    answer:
      "Sim, sempre inclua seu GitHub e LinkedIn na seção de contato. Embora o ATS possa não ler seus repositórios, os recrutadores humanos que aprovarem você certamente o farão.",
  },
  {
    question: "O ATS lê trechos código se eu os colocar?",
    answer:
      "Não coloque trechos de código no seu currículo. Isso confundirá o parser e parecerá bagunçado. Atenha-se a explicar a arquitetura e o impacto nos negócios em texto simples.",
  },
  {
    question: "E se eu conhecer um framework mas ele não estiver listado na vaga?",
    answer:
      "Liste-o na sua seção dedicada de 'Habilidades', mas priorize a stack de tecnologia exigida nos bullet points reais de experiência para garantir uma alta taxa de correspondência.",
  },
] satisfies readonly SeoFaqItem[]

export const dataAnalystSeoFaqItems = [
  {
    question: "Devo incluir um link para o meu portfólio?",
    answer:
      "Sim, adicione um link para o seu GitHub, perfil do Tableau Public ou site pessoal. Certifique-se de que os URLs sejam clicáveis.",
  },
  {
    question: "Preciso saber tanto Python quanto R?",
    answer:
      "Geralmente, conhecer um dos dois muito bem é suficiente. Adapte o seu currículo à linguagem solicitada na descrição da vaga.",
  },
  {
    question: "Como demonstro impacto nos negócios se eu apenas puxei os dados?",
    answer:
      "Pergunte a si mesmo para que os dados foram usados. Se a sua consulta ajudou o marketing a lançar uma campanha, declare que sua extração de dados viabilizou uma campanha que gerou X leads.",
  },
] satisfies readonly SeoFaqItem[]

export const marketingSeoFaqItems = [
  {
    question: "Onde coloco meu portfólio de campanhas/design?",
    answer:
      "Inclua um link de hipertexto simples na seção de contato (cabeçalho) apontando para o seu site pessoal ou Behance.",
  },
  {
    question: "Devo focar em criatividade ou dados?",
    answer:
      "Dados. O ATS não avalia criatividade. Você passa pela máquina com palavras-chave analíticas (ROI, SEO, HubSpot) e mostra a criatividade na entrevista.",
  },
  {
    question: "Qual a diferença entre MQL e SQL no currículo?",
    answer:
      "Usar MQL (Marketing Qualified Lead) mostra que você sabe qualificar o topo do funil. Mencionar que eles viraram SQLs mostra alinhamento com a equipe de Vendas.",
  },
] satisfies readonly SeoFaqItem[]

export const customerSuccessSeoFaqItems = [
  {
    question: "E se a minha empresa não usava o termo 'ARR' ou NRR?",
    answer:
      "Adapte para o contexto comercial da sua empresa (Ticket Médio, Volume de Contratos Renovados, Valor de Carteira), mas certifique-se de mostrar uma métrica de Retenção Financeira clara.",
  },
  {
    question:
      "Devo colocar as ferramentas de Suporte Técnico (Ex: Zendesk, Intercom)?",
    answer:
      "Apenas como secundárias. É mais importante listar as ferramentas de CRM e Sucesso do Cliente (Salesforce, HubSpot, Gainsight) que validam que você faz um trabalho pró-ativo, não reativo.",
  },
  {
    question: "CSM B2C vs B2B: Faz diferença?",
    answer:
      "Total diferença. O processo B2B envolve contas muito mais caras e engajamento executivo, o que recruta as vagas mais altas. Se foi B2B, declare o B2B explicitamente.",
  },
] satisfies readonly SeoFaqItem[]

export const productManagerSeoFaqItems = [
  {
    question:
      "Devo incluir projetos paralelos se não tiver experiência formal como PM?",
    answer:
      "Sim. Construir e lançar um projeto paralelo mostra iniciativa, empatia pelo usuário e compreensão técnica — características fundamentais de um PM.",
  },
  {
    question: "Quão técnico meu currículo precisa ser?",
    answer:
      "Adapte à vaga. Para um PM padrão, foque no 'o quê' e no 'porquê'. Para um PM Técnico, aprofunde-se no 'como' e no design do sistema.",
  },
  {
    question: "Vale a pena listar uma certificação de Scrum Master (CSM)?",
    answer:
      "Sim, liste na seção de habilidades, mas garanta que os marcadores da sua experiência mostrem que você realmente aplicou os princípios Ágeis.",
  },
] satisfies readonly SeoFaqItem[]

export const salesSeoFaqItems = [
  {
    question: "Devo colocar o nome dos clientes que fechei?",
    answer:
      "Depende de NDA (Acordo de Sigilo). Para grandes marcas, você pode usar termos como 'Top 5 Bancos Nacionais' ou 'Gigante do Varejo' se não puder dizer o nome.",
  },
  {
    question:
      "Como mostro que bati a meta se minha empresa faliu / não tinha produto?",
    answer:
      "Seja honesto. Foque no pipeline gerado ou na métrica de atividade: 'Gerou US$ 500k em pipeline qualificado nos primeiros 3 meses antes da reestruturação da empresa.'",
  },
  {
    question: "A ordem das informações importa?",
    answer:
      "Sim. A primeira coisa sob o título do cargo deve ser o seu Atingimento de Cota (Quota Attainment). Vá direto ao dinheiro.",
  },
] satisfies readonly SeoFaqItem[]

export const financeSeoFaqItems = [
  {
    question: "Devo incluir certificações como CFA, CPA ou CGA?",
    answer:
      "Absolutamente, sim. Adicione a certificação no topo (logo ao lado do seu nome ou abaixo do título) e em uma seção de Educação dedicada, pois o ATS buscará essas siglas.",
  },
  {
    question: "O nível de detalhe contábil importa?",
    answer:
      "Sim, especialmente para Controladoria. O recrutador pode não entender de 'US GAAP' vs 'IFRS', mas o sistema está programado para verificar a conformidade regulatória específica.",
  },
  {
    question: "Como colocar projetos confidenciais?",
    answer:
      "Especifique a indústria e o valor sem o nome: 'Conduziu a due diligence financeira para uma aquisição de US$ 25M de uma startup de logística SaaS (Confidencial)'.",
  },
] satisfies readonly SeoFaqItem[]

export const dataEngineerSeoFaqItems = [
  {
    question: "Preciso saber Scala se eu sei Python?",
    answer:
      "Python é o padrão, mas Scala é altamente valorizado para otimizações profundas no Spark. Liste ambos se souber, mas adapte à vaga.",
  },
  {
    question: "Devo incluir habilidades de Data Science ou ML?",
    answer:
      "Apenas se for relevante para a função (ex: MLOps). Caso contrário, mantenha o foco estritamente na movimentação, armazenamento e confiabilidade de dados.",
  },
  {
    question: "Como demonstro impacto nos negócios?",
    answer:
      "Foque em custo (ex: 'Otimizou jobs no Spark, economizando $15k/mês em custos na AWS') ou capacitação (ex: 'Reduziu a latência dos relatórios, viabilizando dashboards executivos em tempo real').",
  },
] satisfies readonly SeoFaqItem[]
