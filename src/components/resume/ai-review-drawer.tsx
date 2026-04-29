"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CVState } from "@/types/cv"

type AiReviewDrawerProps = {
  originalCvState: CVState
  optimizedCvState: CVState
  jobDescription?: string
}

export function AiReviewDrawer({
  originalCvState,
  optimizedCvState,
  jobDescription,
}: AiReviewDrawerProps) {

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 h-full flex flex-col">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">Revisão da IA</h2>
      </div>

        <Tabs defaultValue="summary" className="flex-1 flex flex-col mt-6 px-6 pb-6">
          <TabsList className="grid w-full grid-cols-4 bg-neutral-100 mb-4">
            <TabsTrigger value="summary" className="text-xs">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="attention" className="text-xs">
              Atenção
            </TabsTrigger>
            <TabsTrigger value="changes" className="text-xs">
              Mudanças
            </TabsTrigger>
            <TabsTrigger value="job" className="text-xs">
              Vaga
            </TabsTrigger>
          </TabsList>

          {/* Resumo Tab */}
          <TabsContent value="summary" className="flex-1 overflow-y-auto space-y-4 py-0">
            <div className="space-y-3">
              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
                <p className="text-xs font-semibold text-neutral-900 mb-1">
                  Posição Alvo Identificada
                </p>
                <p className="text-sm text-neutral-700">
                  Engenheiro de Software Sênior
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                <p className="text-xs font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Principais Melhorias
                </p>
                <ul className="space-y-1 text-sm text-neutral-700">
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    <span>Adicionadas 5 skills relevantes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    <span>Otimizado resumo profissional</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600">•</span>
                    <span>Reescrita experiência com foco em resultados</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
                <p className="text-xs font-semibold text-neutral-900 mb-2">
                  Palavras-chave Prioritárias
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    React
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    TypeScript
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    AWS
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    CI/CD
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Atenção Tab */}
          <TabsContent value="attention" className="flex-1 overflow-y-auto space-y-4 py-0">
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-900 text-sm">
                      Afirmação sem comprovação
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      Você mencionou "liderança de equipes de 50+ pessoas" mas não forneceu evidências em seu currículo.
                    </p>
                    <p className="text-xs text-amber-700 mt-2 font-medium">
                      Sugestão: Adicione informações de posições de liderança anteriores
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-900 text-sm">
                      Mismatch de senioridade
                    </p>
                    <p className="text-sm text-red-800 mt-1">
                      A vaga requer 8 anos de experiência, você tem 5 anos documentados.
                    </p>
                    <p className="text-xs text-red-700 mt-2 font-medium">
                      Sugestão: Destaque projetos mais desafiadores ou independentes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Mudanças Tab */}
          <TabsContent value="changes" className="flex-1 overflow-y-auto space-y-4 py-0">
            <div className="space-y-3">
              {["Resumo Profissional", "Experiência", "Skills", "Educação"].map((section, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors"
                >
                  <p className="font-semibold text-neutral-900 text-sm mb-2">
                    {section}
                  </p>
                  <p className="text-xs text-neutral-600 mb-3">
                    {section === "Resumo Profissional"
                      ? "Reformulado para destacar experiência em leadership"
                      : section === "Experiência"
                        ? "Reescrita com ênfase em métricas e resultados"
                        : section === "Skills"
                          ? "Adicionadas 5 novas competências relevantes"
                          : "Sem mudanças significativas"}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Ver no currículo
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Comparar trecho
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Vaga Tab */}
          <TabsContent value="job" className="flex-1 overflow-y-auto space-y-4 py-0">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase">
                  Resumo da Vaga
                </p>
                <p className="text-sm text-neutral-700">
                  {jobDescription || "Engenheiro de Software Sênior com foco em arquitetura e liderança técnica."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 mb-3 uppercase flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Requisitos Cobertos
                </p>
                <ul className="space-y-2">
                  {["React e TypeScript", "Experiência com AWS", "Conhecimento em CI/CD", "Liderança de projetos"].map(
                    (req, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-emerald-600 flex-shrink-0">✓</span>
                        <span>{req}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 mb-3 uppercase flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Lacunas Não Preenchidas
                </p>
                <ul className="space-y-2">
                  {["Machine Learning (não presente no seu currículo)", "Gestão de produto (fora do escopo)"].map(
                    (gap, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-amber-600 flex-shrink-0">−</span>
                        <span>{gap}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
