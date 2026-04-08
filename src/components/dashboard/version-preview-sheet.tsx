'use client'

import type { CVState } from '@/types/cv'
import type { SerializedTimelineEntry } from '@/types/dashboard'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

type VersionPreviewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: SerializedTimelineEntry
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch {
    return value
  }
}

function renderList(items: string[]) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum item disponível.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
          {item}
        </li>
      ))}
    </ul>
  )
}

function renderExperience(cvState: CVState) {
  if (cvState.experience.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma experiência disponível.</p>
  }

  return (
    <div className="space-y-3">
      {cvState.experience.map((item, index) => (
        <div key={`${item.company}-${item.title}-${index}`} className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <div className="space-y-1">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.company}
              {item.location ? ` • ${item.location}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.startDate} - {item.endDate}
            </p>
          </div>
          {item.bullets.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="text-sm text-muted-foreground">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function renderEducation(cvState: CVState) {
  if (cvState.education.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma formação disponível.</p>
  }

  return (
    <div className="space-y-3">
      {cvState.education.map((item, index) => (
        <div key={`${item.institution}-${item.degree}-${index}`} className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="font-medium">{item.degree}</p>
          <p className="text-sm text-muted-foreground">{item.institution}</p>
          <p className="text-xs text-muted-foreground">{item.year}</p>
        </div>
      ))}
    </div>
  )
}

export function VersionPreviewSheet({
  open,
  onOpenChange,
  version,
}: VersionPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {version.label}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {version.scope}
            </Badge>
          </div>
          <SheetTitle>Prévia da versão</SheetTitle>
          <SheetDescription>Criada em {formatDate(version.createdAt)}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Contato
              </h3>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                <p className="font-medium">{version.snapshot.fullName}</p>
                <p className="text-muted-foreground">{version.snapshot.email}</p>
                <p className="text-muted-foreground">{version.snapshot.phone}</p>
                {version.snapshot.linkedin ? <p className="text-muted-foreground">{version.snapshot.linkedin}</p> : null}
                {version.snapshot.location ? <p className="text-muted-foreground">{version.snapshot.location}</p> : null}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Resumo
              </h3>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                {version.snapshot.summary || 'Resumo não preenchido.'}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Skills
              </h3>
              {renderList(version.snapshot.skills)}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Experiência
              </h3>
              {renderExperience(version.snapshot)}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Educação
              </h3>
              {renderEducation(version.snapshot)}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Certificações
              </h3>
              {renderList((version.snapshot.certifications ?? []).map((item) => `${item.name} • ${item.issuer}`))}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
