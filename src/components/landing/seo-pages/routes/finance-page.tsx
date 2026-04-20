"use client";

import SEOPageTemplate from "@/components/landing/seo-pages/seo-page-template";
import { Building2 } from "lucide-react";
import { motion as Motion } from "motion/react";

export default function FinancePage() {
  return (
    <SEOPageTemplate
      slug="curriculo-financeiro-ats"
      role="Finanças"
      theme={{
        accent: "bg-slate-700",
        bgAccent: "bg-slate-500/10",
        textAccent: "text-slate-600",
        badgeLabel: "Guia de currículo Financeiro",
        icon: <Building2 className="w-6 h-6 text-slate-600" />,
        heroVisual: (
          <div className="w-full h-full flex flex-col justify-end bg-white p-8 rounded-b-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-500/10 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="w-full relative z-10 flex flex-col gap-8 h-full justify-center mt-4">
              <div className="flex justify-between items-end px-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    EBITDA Margin
                  </div>
                  <div className="text-4xl font-mono font-bold text-[#0a0a0a] tracking-tighter">
                    24.5%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-mono uppercase mb-1">
                    OpEx Savings
                  </div>
                  <div className="text-2xl font-mono text-emerald-600 font-bold">-$2.4M</div>
                </div>
              </div>

              <div className="w-full h-[120px] relative flex items-end justify-between px-2 z-10">
                <div className="absolute inset-0 flex flex-col justify-between opacity-30 pointer-events-none pb-0 pt-4 -z-10">
                  <div className="w-full h-[1px] bg-slate-200" />
                  <div className="w-full h-[1px] bg-slate-200" />
                  <div className="w-full h-[1px] bg-slate-200" />
                  <div className="w-full h-[1px] bg-slate-200" />
                </div>

                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "24px", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.4 }}
                  className="w-8 sm:w-10 shrink-0 bg-gradient-to-t from-slate-200 to-slate-300 rounded-t-sm origin-bottom"
                />
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "42px", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                  className="w-8 sm:w-10 shrink-0 bg-gradient-to-t from-slate-200 to-slate-300 rounded-t-sm origin-bottom"
                />
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "30px", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
                  className="w-8 sm:w-10 shrink-0 bg-gradient-to-t from-slate-200 to-slate-300 rounded-t-sm origin-bottom"
                />
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "78px", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.4 }}
                  className="w-8 sm:w-10 shrink-0 bg-gradient-to-t from-slate-300 to-slate-400 rounded-t-sm origin-bottom"
                />
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "108px", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, type: "spring", bounce: 0.4 }}
                  className="w-8 sm:w-10 shrink-0 bg-gradient-to-t from-emerald-100 to-emerald-400 rounded-t-sm shadow-[0_0_12px_rgba(52,211,153,0.2)] border-t border-emerald-400 relative origin-bottom"
                >
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-t-sm animate-pulse" />
                </Motion.div>
              </div>

              <div className="flex justify-between text-[10px] text-zinc-500 font-mono px-2 border-t border-zinc-200 pt-3 mt-1 relative z-10">
                <span className="w-8 sm:w-10 shrink-0 text-center">Q1</span>
                <span className="w-8 sm:w-10 shrink-0 text-center">Q2</span>
                <span className="w-8 sm:w-10 shrink-0 text-center">Q3</span>
                <span className="w-8 sm:w-10 shrink-0 text-center">Q4</span>
                <span className="w-8 sm:w-10 shrink-0 text-center text-emerald-600 font-bold">
                  FY25
                </span>
              </div>
            </div>
          </div>
        ),
      }}
      content={{
        heroTitle: "O Currículo Financeiro perfeito para o ATS",
        heroSubtitle:
          "Traduza suas planilhas em impacto real. Destaque suas habilidades de FP&A, modelagem e redução de custos no formato que os recrutadores buscam.",
        problemCards: [
          {
            title: "Planilhas Não Lidas",
            desc: "Listar 'Excel Avançado' repetidamente sem mencionar modelagem de 3 statements, macros ou automação que salvaram dias de trabalho.",
          },
          {
            title: "Foco Operacional",
            desc: "Descrever o fechamento contábil mensal de forma robótica sem focar em como sua análise evitou riscos ou gerou oportunidades financeiras.",
          },
          {
            title: "ERP e Sistemas Ocultos",
            desc: "Omitir sistemas cruciais como SAP, Oracle ou NetSuite, que os recrutadores configuram o ATS para classificar como eliminatórios se ausentes.",
          },
        ],
        filterChecklist: [
          {
            item: "Domínio de ERPs listados com o módulo específico (ex: SAP FICO)",
            checked: true,
          },
          {
            item: "Economias geradas (Cost Savings) quantificadas em dólares/reais",
            checked: true,
          },
          {
            item: "Tipos de relatórios gerados explicitamente (DRE, Fluxo de Caixa, Balanço)",
            checked: true,
          },
          {
            item: "Ocultar a escala/faturamento da empresa em que você trabalhou",
            checked: false,
          },
          {
            item: "Layouts complexos e tabelas de habilidades financeiras (quebram o parser)",
            checked: false,
          },
        ],
        keywords: [
          { category: "Modelagem & Análise", term: "FP&A / Financial Modeling" },
          { category: "Modelagem & Análise", term: "Variance Analysis / Forecasting" },
          { category: "Modelagem & Análise", term: "Valuation / M&A / Due Diligence" },
          { category: "Contabilidade & Report", term: "US GAAP / IFRS / CPC" },
          { category: "Contabilidade & Report", term: "Month-End Close / Reconciliation" },
          { category: "Contabilidade & Report", term: "Audit / Compliance / SOX" },
          { category: "Operações & Caixa", term: "Cash Flow Management" },
          { category: "Operações & Caixa", term: "Working Capital" },
          { category: "Operações & Caixa", term: "Risk Management" },
          { category: "Ferramentas & ERP", term: "Excel (VBA, Power Query)" },
          { category: "Ferramentas & ERP", term: "SAP / Oracle / NetSuite" },
        ],
        goodVsBad: {
          bad: "Responsável pelo orçamento, planilhas financeiras e por analisar onde a empresa gastava muito dinheiro.",
          good: "Desenvolveu um modelo de forecasting (FP&A) para despesas operacionais (OpEx) com 98% de precisão, suportando a tomada de decisão da diretoria (C-Level) e reduzindo o desvio orçamentário em 15% YoY.",
        },
        specializations: [
          {
            title: "FP&A (Planejamento)",
            desc: "Foco profundo em orçamentação (Budgeting), forecasting, modelagem financeira complexa e análise de P&L.",
            tags: ["Forecasting", "Modelagem", "P&L", "Power BI"],
          },
          {
            title: "Controladoria Corporativa",
            desc: "Destaque em reconciliação, relatórios estatutários, auditorias externas, compliance (SOX) e impostos.",
            tags: ["US GAAP", "IFRS", "Month-End Close", "Auditoria"],
          },
          {
            title: "Corporate Finance / M&A",
            desc: "Ênfase em valuation, due diligence, levantamento de capital, alocação de recursos e estratégia de investimentos.",
            tags: ["Valuation", "Due Diligence", "Fusões e Aquisições"],
          },
          {
            title: "Tesouraria (Treasury)",
            desc: "Concentre-se em gestão de caixa e liquidez, relações bancárias, gestão de riscos cambiais e políticas de crédito.",
            tags: ["Fluxo de Caixa", "Câmbio/FX", "Capital de Giro", "Risco de Crédito"],
          },
        ],
        seniority: [
          {
            level: "Analista Financeiro",
            tips: [
              "Destaque a proficiência avançada em Excel (Índice-Corresp, Power Pivot, Macros) e na operação do ERP.",
              "Mostre capacidade de lidar com altos volumes de dados de forma independente e sem erros.",
            ],
          },
          {
            level: "Coordenador / Controller",
            tips: [
              "Foque na automação de processos, melhorias no controle interno e redução do tempo de fechamento.",
              "Destaque a colaboração interfuncional com líderes não financeiros para ajustar orçamentos.",
            ],
          },
          {
            level: "Diretor / CFO",
            tips: [
              "Discuta relacionamento com investidores, fusões e aquisições (M&A) e gestão de capital.",
              "Apresente o impacto de suas estratégias de alocação de recursos no EBITDA corporativo.",
            ],
          },
        ],
        roadmap: [
          {
            step: "Declare seus Sistemas",
            detail: "O ATS recusa candidatos seniores sem os ERPs corretos. Certifique-se de listar as ferramentas contábeis exatas.",
          },
          {
            step: "Exiba os Milhões",
            detail: "A linguagem financeira são os números. Se você ajudou em uma rodada de Série B, informe o valor (US$ 30M).",
          },
          {
            step: "Remova Jargões Vazios",
            detail: "Líderes de finanças não gostam de excesso criativo. Seja conciso e use marcadores orientados a resultados.",
          },
          {
            step: "Garanta a Formatação Linear",
            detail: "Muitos analistas tentam colocar o currículo em tabelas de Excel. Converta para um PDF limpo, de coluna única, em A4.",
          },
        ],
        faq: [
          {
            q: "Devo incluir certificações como CFA, CPA ou CGA?",
            a: "Absolutamente, sim. Adicione a certificação no topo (logo ao lado do seu nome ou abaixo do título) e em uma seção de Educação dedicada, pois o ATS buscará essas siglas.",
          },
          {
            q: "O nível de detalhe contábil importa?",
            a: "Sim, especialmente para Controladoria. O recrutador pode não entender de 'US GAAP' vs 'IFRS', mas o sistema está programado para verificar a conformidade regulatória específica.",
          },
          {
            q: "Como colocar projetos confidenciais?",
            a: "Especifique a indústria e o valor sem o nome: 'Conduziu a due diligence financeira para uma aquisição de US$ 25M de uma startup de logística SaaS (Confidencial)'.",
          },
        ],
      }}
    />
  );
}
