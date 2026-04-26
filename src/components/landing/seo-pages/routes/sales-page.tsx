"use client";

import SEOPageTemplate from "@/components/landing/seo-pages/seo-page-template";
import { salesSeoFaqItems } from "@/lib/seo/seo-page-faqs";
import { BadgeDollarSign, Handshake, BarChart4, ChevronRight } from "lucide-react";
import { motion as Motion } from "motion/react";

export default function SalesPage() {
  return (
    <SEOPageTemplate
      slug="curriculo-vendas-ats"
      role="Vendas"
      theme={{
        accent: "bg-emerald-600",
        bgAccent: "bg-emerald-500/10",
        textAccent: "text-emerald-600",
        badgeLabel: "Guia de Currículo para Vendas",
        icon: <BadgeDollarSign className="w-6 h-6 text-emerald-600" />,
        heroVisual: (
          <div className="w-full h-full flex flex-col justify-center items-center bg-white p-8 rounded-b-xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="w-full relative z-10 flex flex-col gap-10 px-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-emerald-600 font-mono tracking-widest uppercase mb-1">Quota Attainment</div>
                  <div className="text-4xl font-mono font-bold text-[#0a0a0a] tracking-tighter">142<span className="text-xl text-emerald-600">%</span></div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono uppercase justify-end">ARR Fechado <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" /></div>
                  <div className="text-2xl font-mono text-emerald-600 font-bold">$1.25M</div>
                </div>
              </div>

              {/* Horizontal Sales Pipeline */}
              <div className="w-full relative h-24 mt-4">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-zinc-200 -translate-y-1/2" />
                <Motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
                  className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-500 -translate-y-1/2 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                />
                
                <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-4">
                  {/* Lead */}
                  <Motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="flex flex-col items-center gap-3 relative shrink-0"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <div className="w-4 h-4 bg-blue-100 rounded-sm -rotate-45" />
                    </div>
                    <div className="absolute top-full mt-4 text-center">
                      <div className="text-[10px] text-zinc-500 font-mono mb-0.5">LEADS</div>
                      <div className="text-sm font-bold text-blue-600">120</div>
                    </div>
                  </Motion.div>
                  
                  {/* SQL */}
                  <Motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.6 }}
                    className="flex flex-col items-center gap-3 relative shrink-0"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-white border-2 border-emerald-400 flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                      <div className="w-4 h-4 bg-emerald-100 rounded-sm -rotate-45" />
                    </div>
                    <div className="absolute top-full mt-4 text-center">
                      <div className="text-[10px] text-zinc-500 font-mono mb-0.5">SQLs</div>
                      <div className="text-sm font-bold text-emerald-600">45</div>
                    </div>
                  </Motion.div>
                  
                  {/* Closed Won */}
                  <Motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 1.0 }}
                    className="flex flex-col items-center gap-3 relative shrink-0"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center rotate-45 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative">
                      <div className="absolute inset-0 rounded-lg bg-emerald-400/20 animate-ping" />
                      <Handshake className="w-5 h-5 text-white -rotate-45 relative z-10" />
                    </div>
                    <div className="absolute top-full mt-4 text-center">
                      <div className="text-[10px] text-emerald-600 font-mono font-bold mb-0.5">WON</div>
                      <div className="text-base font-bold text-[#0a0a0a]">12</div>
                    </div>
                  </Motion.div>
                </div>
              </div>
            </div>
          </div>
        )
      }}
      content={{
        heroTitle: "Currículo de Vendas B2B Otimizado para ATS",
        heroSubtitle: "Líderes contratam por números. Formate suas cotas, ticket médio e domínio de CRM para que o ATS qualifique seu perfil instantaneamente.",
        problemCards: [
          { title: "Ocultar a Cota", desc: "Dizer que você 'fechou muitos contratos' sem declarar especificamente o tamanho da sua cota (ex: US$ 1M) e o percentual de atingimento (120%)." },
          { title: "Duração do Ciclo", desc: "Falhar em diferenciar entre vendas transacionais de 1 dia e ciclos de vendas corporativas (Enterprise) complexos de 9 meses." },
          { title: "Processo Sem Método", desc: "Não incluir palavras-chave de metodologias de vendas B2B comprovadas (SPIN, MEDDIC, Challenger) que o sistema procura." }
        ],
        filterChecklist: [
          { item: "Metas de vendas (Quota/ARR/MRR) detalhadas monetariamente", checked: true },
          { item: "Metodologia de Vendas B2B citada", checked: true },
          { item: "Softwares de CRM e prospecção (Salesforce, Outreach) listados", checked: true },
          { item: "Omitir o ticket médio (ACV/TCV) dos negócios fechados", checked: false },
          { item: "Adjetivos genéricos como 'bom comunicador'", checked: false }
        ],
        keywords: [
          { category: "Métricas Financeiras", term: "Quota Attainment (%)" },
          { category: "Métricas Financeiras", term: "ARR / MRR / ACV" },
          { category: "Métricas Financeiras", term: "Net New Revenue" },
          { category: "Metodologias B2B", term: "MEDDIC / SPIN Selling" },
          { category: "Metodologias B2B", term: "Challenger Sale / BANT" },
          { category: "Gestão do Processo", term: "Pipeline Management" },
          { category: "Gestão do Processo", term: "Prospecção Outbound / Inbound" },
          { category: "Softwares", term: "Salesforce / HubSpot" },
          { category: "Softwares", term: "Outreach / SalesLoft" }
        ],
        goodVsBad: {
          bad: "Liguei para clientes, apresentei o produto de software e bati minha meta de vendas no ano passado.",
          good: "Executou estratégia de vendas Outbound (MEDDIC) para SaaS, fechando 12 contratos Enterprise com ticket médio (ACV) de US$ 85k, excedendo a cota anual em 140% e liderando a região LATAM em novas receitas."
        },
        specializations: [
          { title: "SDR / BDR", desc: "Foco em volume de prospecção, qualificação, cold calls/emails e geração de pipeline inicial.", tags: ["Outbound", "Cold Calling", "Qualificação", "SalesLoft"] },
          { title: "Account Executive (AE)", desc: "Destaque no fechamento de negócios, apresentações executivas, negociação de contratos e atingimento de metas.", tags: ["Fechamento", "Quota Attainment", "Negociação B2B"] },
          { title: "Customer Success / AM", desc: "Enfase na retenção, upsell, cross-sell, redução de churn e expansão do valor da conta.", tags: ["Renovação", "Upsell / Cross-sell", "Gestão de Contas"] },
          { title: "Sales Engineering (SE)", desc: "Concentre-se em demonstrações técnicas complexas (PoC/PoV), arquitetura de soluções e fechamento com stakeholders técnicos.", tags: ["Pré-Vendas", "Provas de Conceito", "Vendas Técnicas", "Desenho de Soluções"] }
        ],
        seniority: [
          { level: "SDR / Executivo Júnior", tips: ["Destaque tenacidade: número de ligações diárias (volume) e taxas de conversão de lead para reunião.", "Mostre familiaridade com cadências de email e qualificação rápida."] },
          { level: "Executivo Pleno (Mid-Market)", tips: ["Foque no ACV consistente e na previsibilidade do pipeline.", "Mostre proficiência em lidar com decisores C-Level e processos de compras com múltiplos stakeholders."] },
          { level: "Enterprise / Sales Director", tips: ["Discuta o processo de RFP/RFI, ciclos de 6-12 meses e acordos multimilionários.", "Se líder, detalhe o recrutamento da equipe, a precisão das previsões (forecasting) e a estratégia territorial."] }
        ],
        roadmap: [
          { step: "Insira as Métricas", detail: "Audite todos os seus anos de experiência e garanta que a Cota (Goal) vs Realizado (%) esteja clara." },
          { step: "Defina seu Alvo", detail: "Especifique se você vendia para SMB (Pequenas/Médias), Mid-Market ou Enterprise (Fortune 500)." },
          { step: "Mostre o Método", detail: "Vender não é sorte. O ATS busca palavras como SPIN, BANT ou MEDDIC para validar sua senioridade." },
          { step: "Simplifique o Layout", detail: "Vendedores adoram currículos chamativos. Recrutadores e o ATS preferem texto alinhado, limpo e direto ao ponto." }
        ],
        faq: salesSeoFaqItems
      }}
    />
  );
}



