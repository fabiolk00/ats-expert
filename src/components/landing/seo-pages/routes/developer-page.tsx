"use client";

import SEOPageTemplate from "@/components/landing/seo-pages/seo-page-template";
import { Code2 } from "lucide-react";

export default function DeveloperPage() {
  return (
    <SEOPageTemplate
      slug="curriculo-desenvolvedor-ats"
      role="Desenvolvedor de Software"
      theme={{
        accent: "bg-blue-600",
        bgAccent: "bg-blue-500/10",
        textAccent: "text-blue-600",
        badgeLabel: "Guia de CurrÃ­culo para Devs",
        icon: <Code2 className="w-6 h-6 text-blue-600" />,
        heroVisual: (
          <div className="w-full h-full p-8 font-mono text-[13px] leading-relaxed flex flex-col justify-center bg-white text-zinc-700 rounded-b-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex gap-4 mb-6 opacity-80">
              <div className="flex flex-col items-end text-zinc-400 select-none border-r border-zinc-200 pr-4">
                <span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span><span>07</span><span>08</span>
              </div>
              <div className="flex-1 relative">
                <div className="absolute right-0 top-0 w-32 h-24 bg-blue-50 border border-blue-200 rounded flex flex-col p-2 shadow-sm">
                  <span className="text-[9px] text-blue-600/80 mb-1 font-bold">ATS PARSE TREE</span>
                  <div className="flex-1 border-l border-b border-blue-200 ml-2 mb-2 relative">
                    <div className="absolute right-2 top-2 w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="absolute right-6 bottom-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="text-zinc-500 mb-2">{'/* ATS Readiness optimization */'}</div>
                <div><span className="text-pink-600">import</span> {'{ '}<span className="text-blue-600">Scanner</span>{' }'} <span className="text-pink-600">from</span> <span className="text-emerald-600">&apos;@curria/ats&apos;</span>;</div>
                <br/>
                <div><span className="text-pink-600">const</span> <span className="text-[#0a0a0a]">resume</span> <span className="text-pink-600">=</span> <span className="text-pink-600">await</span> <span className="text-blue-600">Scanner</span>.<span className="text-blue-500">analyze</span>();</div>
                <br/>
                <div><span className="text-pink-600">if</span> (<span className="text-[#0a0a0a]">resume</span>.<span className="text-blue-500">score</span> <span className="text-pink-600">&gt;</span> <span className="text-orange-500">95</span>) {'{'}</div>
                <div className="pl-4"><span className="text-blue-600">console</span>.<span className="text-blue-500">log</span>(<span className="text-emerald-600">&apos;? Entrevista Garantida&apos;</span>);</div>
                <div>{'}'}</div>
              </div>
            </div>
            
            <div className="mt-auto border-t border-zinc-200 pt-4 bg-zinc-50 -mx-8 -mb-8 px-8 pb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-emerald-600 font-bold tracking-wide">STATUS: APROVADO</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                   <div className="w-[98%] h-full bg-emerald-500" />
                </div>
                <div className="text-zinc-600 font-bold text-xs">98/100</div>
              </div>
            </div>
          </div>
        )
      }}
      content={{
        heroTitle: "CurrÃ­culo de Desenvolvedor otimizado para ATS",
        heroSubtitle: "Pare de ser rejeitado por algoritmos. Formate sua stack e impacto da maneira exata que os parsers e recrutadores buscam.",
        problemCards: [
          { title: "Stack TecnolÃ³gica Oculta", desc: "Se vocÃª esconder sua stack em parÃ¡grafos densos, o parser falha em associar a habilidade aos seus anos de experiÃªncia." },
          { title: "Impacto de Engenharia Vago", desc: "'Escrevi cÃ³digo para o backend' nÃ£o traduz para uma vaga sÃªnior. VocÃª precisa de mÃ©tricas exatas de latÃªncia, escala e performance." },
          { title: "Links do GitHub Ignorados", desc: "Muitos sistemas ATS nÃ£o conseguem seguir URLs. Se suas conquistas vivem apenas nos seus repositÃ³rios, elas nÃ£o existem para o ATS." }
        ],
        filterChecklist: [
          { item: "Fontes padrÃ£o sem kerning customizado", checked: true },
          { item: "ExperiÃªncia cronolÃ³gica lida com sucesso", checked: true },
          { item: "Match exato para linguagens requeridas (ex: 'Node.js' vs 'Node')", checked: true },
          { item: "Layouts complexos de tabelas para habilidades", checked: false },
          { item: "GrÃ¡ficos SVG de progresso ou pizza", checked: false }
        ],
        keywords: [
          { category: "Linguagens", term: "JavaScript / TypeScript" },
          { category: "Linguagens", term: "Python / Go / Rust" },
          { category: "Linguagens", term: "Java / C#" },
          { category: "Frameworks", term: "React / Next.js" },
          { category: "Frameworks", term: "Spring Boot" },
          { category: "Frameworks", term: "Node.js / NestJS" },
          { category: "Infraestrutura", term: "Docker / Kubernetes" },
          { category: "Infraestrutura", term: "AWS / GCP / Azure" },
          { category: "Infraestrutura", term: "CI/CD (Actions/GitLab)" },
          { category: "Arquitetura & BD", term: "MicroserviÃ§os / APIs REST" },
          { category: "Arquitetura & BD", term: "PostgreSQL / MongoDB" },
          { category: "Arquitetura & BD", term: "Redis / Kafka" },
        ],
        goodVsBad: {
          bad: "ResponsÃ¡vel por melhorar o banco de dados e deixar a aplicaÃ§Ã£o mais rÃ¡pida.",
          good: "Arquitetou uma camada de cache distribuÃ­da em Redis, reduzindo a carga no banco de dados em 40% e melhorando o tempo de resposta da API de 800ms para 120ms em mais de 2 milhÃµes de requisiÃ§Ãµes diÃ¡rias."
        },
        specializations: [
          { title: "Engenharia Frontend", desc: "Foque fortemente em performance de renderizaÃ§Ã£o, gerenciamento de estado e arquitetura moderna de componentes.", tags: ["React", "Gerenciamento de Estado", "Web Vitals", "Acessibilidade (A11y)"] },
          { title: "Arquitetura Backend", desc: "Enfatize design de sistemas, otimizaÃ§Ã£o de banco de dados, cache e microsserviÃ§os.", tags: ["MicrosserviÃ§os", "System Design", "SQL/NoSQL", "APIs GraphQL/REST"] },
          { title: "DevOps / SRE", desc: "Destaque automaÃ§Ã£o, eficiÃªncia de pipelines, infraestrutura em nuvem e uptime.", tags: ["Terraform", "Kubernetes", "Pipelines CI/CD", "Monitoramento"] },
          { title: "Mobile / iOS & Android", desc: "Concentre-se em design responsivo, gerenciamento de estado nativo, publicaÃ§Ã£o em lojas de apps e performance mobile.", tags: ["React Native", "Swift/Kotlin", "App Store/Play Store", "Performance Mobile"] }
        ],
        seniority: [
          { level: "Desenvolvedor JÃºnior", tips: ["Destaque projetos pessoais e as stacks de tecnologia exatas utilizadas.", "Foque na agilidade de aprendizado, trabalho em equipe e code reviews.", "NÃ£o exagere nas suas habilidades; seja honesto sobre seus fundamentos."] },
          { level: "Desenvolvedor Pleno", tips: ["Mostre propriedade sobre features inteiras, do design ao deploy.", "Quantifique as melhorias de performance e reduÃ§Ã£o de bugs.", "Mencione a mentoria de juniores ou a lideranÃ§a de pequenas sprints Ã¡geis."] },
          { level: "Engenheiro SÃªnior / Staff", tips: ["Foque em arquitetura de sistemas, escalabilidade e padrÃµes de engenharia.", "Mostre impacto de negÃ³cios (ex: reduziu os custos de nuvem em 30%).", "Destaque a lideranÃ§a interfuncional e o planejamento de roadmap."] }
        ],
        roadmap: [
          { step: "Audite Sua Stack", detail: "Extraia cada linguagem, framework e ferramenta que vocÃª conhece. Categorize-os claramente no topo." },
          { step: "Alinhe com a Vaga", detail: "Modifique seus bullet points para apresentar proeminentemente as palavras-chave exatas que o empregador busca." },
          { step: "Quantifique o CÃ³digo", detail: "Adicione nÃºmeros reais: linhas de cÃ³digo refatoradas, latÃªncia reduzida, usuÃ¡rios suportados ou custos economizados." },
          { step: "Formate para a MÃ¡quina", detail: "Remova colunas, tabelas complexas e grÃ¡ficos. Atenha-se a uma coluna Ãºnica e parsing padrÃ£o de PDF." }
        ],
        faq: [
          { q: "Devo incluir um link para o meu GitHub?", a: "Sim, sempre inclua seu GitHub e LinkedIn na seÃ§Ã£o de contato. Embora o ATS possa nÃ£o ler seus repositÃ³rios, os recrutadores humanos que aprovarem vocÃª certamente o farÃ£o." },
          { q: "O ATS lÃª trechos de cÃ³digo se eu os colocar?", a: "NÃ£o coloque trechos de cÃ³digo no seu currÃ­culo. Isso confundirÃ¡ o parser e parecerÃ¡ bagunÃ§ado. Atenha-se a explicar a arquitetura e o impacto nos negÃ³cios em texto simples." },
          { q: "E se eu conhecer um framework mas ele nÃ£o estiver listado na vaga?", a: "Liste-o na sua seÃ§Ã£o dedicada de 'Habilidades', mas priorize a stack de tecnologia exigida nos bullet points reais de experiÃªncia para garantir uma alta taxa de correspondÃªncia." }
        ]
      }}
    />
  );
}





