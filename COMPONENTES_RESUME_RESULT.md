# Componentes de Resultado do Resume

Este documento descreve a estrutura dos componentes criados para a página de resultado do resume (Job Targeting) conforme a especificação fornecida.

## Estrutura de Componentes

### 1. **ResumeResultPage** (`resume-result-page.tsx`)
Componente principal que orquestra toda a página de resultado do resume.

**Responsabilidades:**
- Exibe header com título, subtítulo e badges de metadados
- Gerencia os botões de ação (Baixar PDF, Gerar nova versão, Comparar com original)
- Controla o estado de comparação entre resumes
- Alterna entre visualização padrão e modo de comparação split
- Gerencia a visibilidade do drawer de revisão da IA

**Props:**
```typescript
- optimizedCvState: CVState (currículo otimizado)
- originalCvState: CVState (currículo original)
- jobDescription?: string (descrição da vaga)
- onDownloadPdf?: () => void
- onGenerateNewVersion?: () => void
- onComparisonChange?: (isComparing: boolean) => void
```

---

### 2. **ResumePreviewCard** (`resume-preview-card.tsx`)
Exibe um currículo em formato de cartão de visualização limpo e bem estruturado.

**Responsabilidades:**
- Renderiza todas as seções do currículo (nome, contato, resumo, experiência, skills, educação, certificações)
- Suporta dois variantes: "optimized" (borda verde) e "original" (borda neutra)
- Estilo limpo e profissional, adequado para impressão

**Props:**
```typescript
- cvState: CVState
- variant?: "optimized" | "original"
- className?: string
```

**Seções Renderizadas:**
- Header (nome e contato)
- Resumo Profissional
- Experiência Profissional (com bullets)
- Competências (skills)
- Educação
- Certificações

---

### 3. **ResumeSplitComparison** (`resume-split-comparison.tsx`)
Exibe comparação lado a lado (desktop) ou em abas (mobile) entre currículo original e otimizado.

**Responsabilidades:**
- Detecta tamanho de tela e alterna entre layout split (desktop) e abas (mobile)
- Exibe ambos os resumes em visualização comparativa
- Renderiza botão para voltar à visualização padrão

**Props:**
```typescript
- originalCvState: CVState
- optimizedCvState: CVState
- onBack?: () => void
```

**Comportamento:**
- **Desktop (lg):** Dois ResumePreviewCards lado a lado
- **Mobile:** Tabs com "Currículo Original" e "Currículo Otimizado"

---

### 4. **AiReviewDrawer** (`ai-review-drawer.tsx`)
Painel lateral com análise detalhada da IA sobre o resume otimizado.

**Responsabilidades:**
- Exibe 4 abas de informações diferentes
- Renderiza conteúdo contextual baseado na aba selecionada

**Props:**
```typescript
- originalCvState: CVState
- optimizedCvState: CVState
- jobDescription?: string
```

**Abas Disponíveis:**

#### **Resumo**
- Posição alvo identificada
- Principais melhorias realizadas
- Palavras-chave prioritárias (com badges)

#### **Atenção**
- Alertas sobre afirmações sem comprovação
- Mismatch de senioridade
- Recomendações de ação

#### **Mudanças**
- Lista de seções modificadas (Resumo, Experiência, Skills, Educação)
- Descrição das mudanças por seção
- Botões para "Ver no currículo" e "Comparar trecho"

#### **Vaga**
- Resumo da vaga/job description
- Requisitos cobertos ✓
- Lacunas não preenchidas −

---

## UX Decisions Implementadas

### 1. **Layout Flexível (não três colunas fixas)**
- Desktop: Resume otimizado + drawer lado a lado (proporção 2:1)
- Tablet/Mobile: Resume otimizado em tela cheia com toggle para drawer

### 2. **Drawer Collapsível**
- Desktop: Sempre visível por padrão, pode ser fechado
- Mobile: Acessível via botão "Abrir Revisão da IA"
- Responsivo e não interfere no conteúdo principal

### 3. **Modo de Comparação**
- Ativa automaticamente quando usuário clica "Comparar com original"
- Fecha o drawer automaticamente para não ficar três colunas
- Desktop: Split view lado a lado
- Mobile: Abas para melhor usabilidade

### 4. **Estilo Premium (Stripe-like)**
- Fundo branco limpo
- Bordas sutis em neutral-200
- Espaçamento generoso
- Tipografia clara e hierárquica
- Badges coloridas para status
- Ícones informativos (AlertTriangle, CheckCircle2)

---

## Uso

### Exemplo Básico
```tsx
import { ResumeResultPage } from "@/components/resume/resume-result-page"
import type { CVState } from "@/types/cv"

export default function ResultPage() {
  const optimizedResume: CVState = { /* ... */ }
  const originalResume: CVState = { /* ... */ }

  return (
    <ResumeResultPage
      optimizedCvState={optimizedResume}
      originalCvState={originalResume}
      jobDescription="Job description text..."
      onDownloadPdf={() => downloadPdf()}
      onGenerateNewVersion={() => regenerate()}
    />
  )
}
```

### Página de Demonstração
Acesse `/dashboard/resume/result-demo` para ver uma versão completa com dados mock.

---

## Responsividade

| Tamanho | Layout |
|--------|--------|
| Mobile (<768px) | Resume em tela cheia, drawer via toggle |
| Tablet (768px-1024px) | Resume em tela cheia, drawer via toggle |
| Desktop (>1024px) | Resume + drawer lado a lado |

---

## Componentes UI Reutilizados

- `Button` - Botões de ação com variantes
- `Badge` - Tags de metadados
- `Tabs` - Sistema de abas para drawer
- `Card` - (via ResumePreviewCard)

---

## Próximas Melhorias

- [ ] Integração com API real de download de PDF
- [ ] Animações ao alternar entre modos
- [ ] Export de relatório de mudanças
- [ ] Compartilhamento de resultado via link
- [ ] Histórico de comparações
