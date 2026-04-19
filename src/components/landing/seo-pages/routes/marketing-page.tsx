"use client";

import SEOPageTemplate from "@/components/landing/seo-pages/seo-page-template";
import { Megaphone, Mail, Share2, MousePointerClick } from "lucide-react";
import { motion as Motion } from "motion/react";

export default function MarketingPage() {
  return (
    <SEOPageTemplate
      slug="curriculo-marketing-ats"
      role="Marketing"
      theme={{
        accent: "bg-rose-500",
        bgAccent: "bg-rose-500/10",
        textAccent: "text-rose-600",
        badgeLabel: "Guia de Currículo de Marketing",
        icon: <Megaphone className="w-6 h-6 text-rose-500" />,
        heroVisual: (
          <div className="w-full h-full flex flex-col justify-center items-center bg-white p-8 rounded-b-xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-500/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="w-full relative z-10 flex flex-col justify-center h-full gap-8 px-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Megaphone className="w-3 h-3" /> Campaign Funnel
                  </div>
                  <div className="text-3xl font-mono font-bold text-[#0a0a0a] tracking-tighter">CAC -34%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">ROI</div>
                  <div className="text-2xl font-mono font-bold text-emerald-600">+245%</div>
                </div>
              </div>

              {/* Horizontal Funnel Flow */}
              <div className="w-full flex items-center justify-between gap-2 mt-4 relative">
                {/* Connecting lines */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-200 -translate-y-1/2" />
                <Motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
                  className="absolute top-1/2 left-0 h-[1px] bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500 -translate-y-1/2 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                />

                {/* Impressions */}
                <Motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex flex-col items-center gap-3 relative z-10 shrink-0"
                >
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center shadow-sm">
                    <span className="text-indigo-600 font-mono font-bold text-xs">1.2M</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase text-center w-16 shrink-0">Imp</span>
                </Motion.div>
                
                {/* Clicks */}
                <Motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.4 }}
                  className="flex flex-col items-center gap-3 relative z-10 shrink-0"
                >
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white border-2 border-rose-200 flex items-center justify-center shadow-sm">
                    <span className="text-rose-600 font-mono font-bold text-xs">450k</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase text-center w-16 shrink-0">Clicks</span>
                </Motion.div>
                
                {/* MQLs */}
                <Motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.6 }}
                  className="flex flex-col items-center gap-3 relative z-10 shrink-0"
                >
                  <div className="w-14 h-14 shrink-0 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center shadow-sm">
                    <span className="text-amber-600 font-mono font-bold text-sm">12k</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-mono font-bold uppercase text-center w-16 shrink-0">MQLs</span>
                </Motion.div>
                
                {/* SQLs */}
                <Motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.8 }}
                  className="flex flex-col items-center gap-3 relative z-10 shrink-0"
                >
                  <div className="w-16 h-16 shrink-0 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                    <span className="text-white font-mono font-bold text-base relative z-10">3.4k</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-mono font-bold uppercase text-center w-16 shrink-0">SQLs</span>
                </Motion.div>
              </div>
            </div>
          </div>
        )
      }}
      content={{
        heroTitle: "Currículo de Marketing para Conversão de Vagas",
        heroSubtitle: "Traduza sua criatividade em métricas de CAC e ROAS. Faça seu currículo de marketing ser perfeitamente lido pelo ATS e aprovado por diretores.",
        problemCards: [
          { title: "Métricas Ausentes", desc: "Dizer que você 'gerenciou as redes sociais' sem especificar o crescimento percentual de engajamento ou leads gerados (MQLs)." },
          { title: "Falha de Ferramentas", desc: "Omitir o stack exato de MarTech (HubSpot, Marketo, Google Analytics) que o algoritmo está programado para encontrar." },
          { title: "Design Exagerado", desc: "Usar currículos excessivamente criativos no Canva com colunas e gráficos que o ATS simplesmente não consegue ler." }
        ],
        filterChecklist: [
          { item: "Ferramentas de automação listadas explicitamente (ex: Marketo, Salesforce)", checked: true },
          { item: "Métricas de ROI, ROAS e CAC quantificadas", checked: true },
          { item: "Gerenciamento de orçamento (Budget) declarado em valores reais", checked: true },
          { item: "Portfólios visuais integrados no próprio PDF (quebram o ATS)", checked: false },
          { item: "Gráficos de barras para 'nível de habilidade' em SEO/SEM", checked: false }
        ],
        keywords: [
          { category: "Canais & Aquisição", term: "SEO / SEM / PPC" },
          { category: "Canais & Aquisição", term: "Email Marketing / Lifecycle" },
          { category: "Canais & Aquisição", term: "Social Media / Content Strategy" },
          { category: "Automação & CRM", term: "HubSpot / Marketo" },
          { category: "Automação & CRM", term: "Salesforce / Braze" },
          { category: "Analytics & Dados", term: "Google Analytics 4 (GA4)" },
          { category: "Analytics & Dados", term: "Testes A/B / CRO" },
          { category: "Métricas Core", term: "CAC, LTV, ROAS, ROI" }
        ],
        goodVsBad: {
          bad: "Responsável pelo blog da empresa, redes sociais e por trazer mais clientes para o site.",
          good: "Desenvolveu e executou uma estratégia de SEO de conteúdo B2B, aumentando o tráfego orgânico em 120% (de 50k para 110k/mês) e gerando US$ 300 mil em pipeline de vendas originado pelo marketing no primeiro semestre."
        },
        specializations: [
          { title: "Growth Marketing", desc: "Foco profundo em loops de viralidade, otimização da taxa de conversão (CRO), testes A/B e experimentação ágil.", tags: ["CRO", "Testes A/B", "Growth Hacking", "PLG"] },
          { title: "Product Marketing (PMM)", desc: "Enfatize lançamentos GTM (Go-to-Market), posicionamento, precificação, análise competitiva e enablement de vendas.", tags: ["GTM", "Posicionamento", "Sales Enablement"] },
          { title: "Demand Generation", desc: "Destaque gestão de orçamento de mídia paga (PPC), pontuação de leads (lead scoring), MQLs para SQLs e eventos.", tags: ["MQL/SQL", "PPC/SEM", "Lead Scoring", "Webinars"] },
          { title: "SEO / Marketing de Conteúdo", desc: "Concentre-se em pesquisa de palavras-chave, otimização on-page/off-page e atração orgânica em alta escala.", tags: ["Tráfego Orgânico", "Link Building", "Analytics", "Auditoria de SEO"] }
        ],
        seniority: [
          { level: "Analista de Marketing", tips: ["Destaque proficiência técnica na operação de ferramentas (Google Ads, Mailchimp, Canva).", "Mostre capacidade de analisar dados básicos de engajamento."] },
          { level: "Coordenador / Gerente", tips: ["Mostre como você otimizou orçamentos para melhorar o CAC/ROAS.", "Destaque a gestão de campanhas interfuncionais (design, copy, web)."] },
          { level: "Diretor / CMO", tips: ["Foque no crescimento da receita (ARR), custo de aquisição (CAC Payback) e liderança de equipe.", "Discuta o alinhamento da marca corporativa com a estratégia global de vendas."] }
        ],
        roadmap: [
          { step: "Identifique sua Stack", detail: "Liste claramente as plataformas de CRM, CMS e automação de marketing que você domina." },
          { step: "Mostre o Dinheiro", detail: "O Marketing existe para gerar receita. Mencione tamanho do budget e o ROI gerado." },
          { step: "Estruture o Funil", detail: "Descreva a jornada do cliente que você influenciou, desde a atração até a retenção." },
          { step: "Evite Design Excessivo", detail: "Embora você seja criativo, o currículo deve ser em texto limpo para o ATS. Guarde o design para o portfólio." }
        ],
        faq: [
          { q: "Onde coloco meu portfólio de campanhas/design?", a: "Inclua um link de hipertexto simples na seção de contato (cabeçalho) apontando para o seu site pessoal ou Behance." },
          { q: "Devo focar em criatividade ou dados?", a: "Dados. O ATS não avalia criatividade. Você passa pela máquina com palavras-chave analíticas (ROI, SEO, HubSpot) e mostra a criatividade na entrevista." },
          { q: "Qual a diferença entre MQL e SQL no currículo?", a: "Usar MQL (Marketing Qualified Lead) mostra que você sabe qualificar o topo do funil. Mencionar que eles viraram SQLs mostra alinhamento com a equipe de Vendas." }
        ]
      }}
    />
  );
}



