"use client";

import SEOPageTemplate from "@/components/landing/seo-pages/seo-page-template";
import { DatabaseZap } from "lucide-react";
import { motion as Motion } from "motion/react";

export default function DataEngineerPage() {
  return (
    <SEOPageTemplate
      slug="curriculo-engenheiro-de-dados-ats"
      role="Engenheiro de Dados"
      theme={{
        accent: "bg-indigo-600",
        bgAccent: "bg-indigo-500/10",
        textAccent: "text-indigo-600",
        badgeLabel: "Guia para Engenharia de Dados",
        icon: <DatabaseZap className="w-6 h-6 text-indigo-600" />,
        heroVisual: (
          <div className="w-full h-full flex flex-col justify-center items-center bg-white p-10 font-mono text-[13px] text-indigo-700 rounded-b-xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-indigo-500/10 blur-[60px] pointer-events-none" />
            
            <div className="w-full flex items-center justify-between mb-10 relative z-10 px-2">
              <Motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-zinc-100 z-20"
              >
                <div className="text-indigo-600 font-bold relative flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  Kafka Stream
                </div>
                <div className="text-[10px] text-zinc-500 font-bold tracking-widest border-t border-zinc-200 pt-1 w-full text-center">100K/s</div>
              </Motion.div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative px-2">
                <div className="h-[2px] w-full bg-zinc-100 relative overflow-hidden rounded-full">
                   <Motion.div 
                     className="absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-transparent via-indigo-400 to-emerald-400"
                     animate={{ left: ["-25%", "100%"] }}
                     transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                   />
                   <Motion.div 
                     className="absolute top-0 left-0 h-full w-6 bg-indigo-300 opacity-50 blur-[2px]"
                     animate={{ left: ["100%", "-25%"] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 0.5 }}
                   />
                </div>
              </div>
              
              <Motion.div 
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-zinc-100 z-20 relative"
              >
                <Motion.div
                  className="absolute inset-0 rounded-lg border border-emerald-400"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <div className="text-emerald-600 font-bold">
                  Spark (ETL)
                </div>
                <div className="text-[10px] text-zinc-500 font-bold tracking-widest border-t border-zinc-200 pt-1 w-full text-center">PROCESSING</div>
              </Motion.div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative px-2">
                <div className="h-[2px] w-full bg-zinc-100 relative overflow-hidden rounded-full">
                   <Motion.div 
                     className="absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-transparent via-emerald-400 to-blue-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                     animate={{ left: ["-25%", "100%"] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   />
                   <Motion.div 
                     className="absolute top-0 left-0 h-full w-8 bg-blue-300 opacity-50 blur-[2px]"
                     animate={{ left: ["100%", "-25%"] }}
                     transition={{ repeat: Infinity, duration: 1.8, ease: "linear", delay: 0.2 }}
                   />
                </div>
              </div>
              
              <Motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-zinc-100 z-20"
              >
                <div className="text-blue-600 font-bold">
                  Snowflake
                </div>
                <div className="text-[10px] text-zinc-500 font-bold tracking-widest border-t border-zinc-200 pt-1 w-full text-center">WAREHOUSE</div>
              </Motion.div>
            </div>
            
            <div className="w-full max-w-md font-mono text-xs flex flex-col gap-3 relative z-10 border-l border-zinc-200 pl-6">
              <Motion.div 
                animate={{ opacity: [0.7, 1, 0.7] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="flex justify-between items-center text-zinc-500"
              >
                <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> [LOG] Airflow DAG Started</span>
                <span className="text-zinc-400">10:42:01</span>
              </Motion.div>
              <Motion.div 
                animate={{ opacity: [0.7, 1, 0.7] }} 
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                className="flex justify-between items-center"
              >
                <span className="flex items-center gap-3 text-amber-600"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> INFO: Processando 2.5B eventos diários</span>
                <span className="text-zinc-400">10:42:03</span>
              </Motion.div>
              <Motion.div 
                animate={{ opacity: [0.8, 1, 0.8] }} 
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1 }}
                className="flex justify-between items-center"
              >
                <span className="flex items-center gap-3 text-emerald-600 font-semibold tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> SUCCESS: Latência &lt; 50ms</span>
                <span className="text-zinc-400">10:42:05</span>
              </Motion.div>
            </div>
          </div>
        )
      }}
      content={{
        heroTitle: "Currículo de Engenharia de Dados para o ATS",
        heroSubtitle: "Faça o parse do seu próprio currículo. Formate suas pipelines ETL, cloud e Kafka para que algoritmos e tech recruiters aprovem você.",
        problemCards: [
          { title: "Tecnologia de Nuvem Oculta", desc: "Falha ao vincular explicitamente serviços AWS/GCP/Azure (ex: Redshift, BigQuery, S3) às pipelines que você construiu." },
          { title: "Volume de Dados Vago", desc: "Descrever 'grandes conjuntos de dados' em vez de especificar terabytes (TB) ou petabytes (PB) processados diariamente." },
          { title: "Detalhes de Pipeline Ausentes", desc: "Não esclarecer se você construiu processamento em lote (Airflow, dbt) ou streaming em tempo real (Kafka, Flink)." }
        ],
        filterChecklist: [
          { item: "Nomes exatos dos serviços em nuvem (ex: AWS EMR, GCP BigQuery)", checked: true },
          { item: "Distinção clara entre processos ETL e ELT", checked: true },
          { item: "Métricas quantificáveis de redução de latência ou custo", checked: true },
          { item: "Ícones gráficos muito complexos para stacks de tecnologia", checked: false },
          { item: "Títulos de cargo genéricos como 'Profissional de TI'", checked: false }
        ],
        keywords: [
          { category: "Processamento & Streaming", term: "Apache Spark / Hadoop" },
          { category: "Processamento & Streaming", term: "Kafka / Flink" },
          { category: "Orquestração & Cloud", term: "Airflow / dbt" },
          { category: "Orquestração & Cloud", term: "AWS (S3, EMR, Glue)" },
          { category: "Warehouse", term: "Snowflake / Redshift / BigQuery" },
          { category: "Warehouse", term: "Data Lake / Lakehouse" },
          { category: "Linguagens", term: "Python / Scala / Java" },
          { category: "Linguagens", term: "Advanced SQL" }
        ],
        goodVsBad: {
          bad: "Escrevi scripts em Python para limpar dados e colocar na AWS.",
          good: "Criou uma pipeline de ingestão de dados em tempo real utilizando Apache Kafka e Spark Streaming no AWS EMR, reduzindo a latência de dados de 24 horas para menos de 2 minutos."
        },
        specializations: [
          { title: "Data Warehousing", desc: "Foque em Snowflake, Redshift, BigQuery, modelagem dimensional e otimização de consultas.", tags: ["Snowflake", "Redshift", "Modelagem Dimensional", "ELT"] },
          { title: "Streaming / Tempo Real", desc: "Destaque o processamento de baixa latência, Kafka, Flink e arquiteturas orientadas a eventos.", tags: ["Kafka", "Flink", "Tempo Real", "Arquitetura Orientada a Eventos"] },
          { title: "Plataforma de Dados / MLOps", desc: "Enfatize infraestrutura, Kubernetes, Airflow e o provisionamento de modelos para produção.", tags: ["Kubernetes", "Airflow", "MLOps", "Terraform"] },
          { title: "Analytics Engineering", desc: "Concentre-se em construir visões prontas para negócios usando dbt (Data Build Tool), garantindo qualidade, testes e documentação de dados.", tags: ["dbt", "SQL", "Qualidade de Dados", "Testes de Dados"] }
        ],
        seniority: [
          { level: "Engenheiro de Dados Júnior", tips: ["Destaque bases sólidas de Python/SQL e projetos de ETL acadêmicos ou pessoais.", "Foque na compreensão de modelos de dados e em agendamentos básicos com Airflow ou cron."] },
          { level: "Engenheiro de Dados Sênior", tips: ["Mostre propriedade sobre sistemas complexos e distribuídos (Spark, Kafka).", "Destaque a otimização de custos de nuvem e design de infraestrutura (Terraform)."] },
          { level: "Engenheiro Staff / Principal", tips: ["Discuta a arquitetura de dados global, a liderança da equipe e a estratégia de governança de dados.", "Foque na escalabilidade do sistema (PBs de dados) e no alinhamento com Data Science."] }
        ],
        roadmap: [
          { step: "Catalogue Sua Stack", detail: "Liste todas as linguagens (Python, Scala), motores de processamento (Spark) e warehouses (Snowflake)." },
          { step: "Declare o Volume", detail: "Mencione explicitamente se você processa GBs, TBs ou PBs de dados diariamente." },
          { step: "Destaque a Orquestração", detail: "Certifique-se de que Airflow, dbt ou Prefect sejam apresentados de forma proeminente na sua experiência." },
          { step: "Formate para Parsing", detail: "Garanta que o ATS possa extrair facilmente a sua stack de ferramentas sem travar em colunas ou logotipos." }
        ],
        faq: [
          { q: "Preciso saber Scala se eu sei Python?", a: "Python é o padrão, mas Scala é altamente valorizado para otimizações profundas no Spark. Liste ambos se souber, mas adapte à vaga." },
          { q: "Devo incluir habilidades de Data Science ou ML?", a: "Apenas se for relevante para a função (ex: MLOps). Caso contrário, mantenha o foco estritamente na movimentação, armazenamento e confiabilidade de dados." },
          { q: "Como demonstro impacto nos negócios?", a: "Foque em custo (ex: 'Otimizou jobs no Spark, economizando $15k/mês em custos na AWS') ou capacitação (ex: 'Reduziu a latência dos relatórios, viabilizando dashboards executivos em tempo real')." }
        ]
      }}
    />
  );
}



