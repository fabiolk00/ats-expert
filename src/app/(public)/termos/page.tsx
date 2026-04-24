import type { Metadata } from "next"

import { BrandText } from "@/components/brand-wordmark"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Termos de Serviço - CurrIA",
  description: "Termos de serviço e condições de uso da plataforma CurrIA.",
  canonicalPath: "/termos",
})

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Termos de Serviço</h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text="Ao acessar e usar a plataforma CurrIA, você concorda em aceitar estes termos de serviço e todas as leis e regulamentações aplicáveis. Se você não concordar com qualquer um destes termos, está proibido de usar ou acessar este site."
                  className="font-medium text-foreground"
                />
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Uso Apropriado da Licença</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text="É concedida a você uma licença limitada para acessar a plataforma CurrIA apenas para fins legítimos. Você não pode:"
                  className="font-medium text-foreground"
                />
              </p>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                <li>Tentar obter acesso não autorizado aos sistemas</li>
                <li>Transmitir qualquer código malicioso ou prejudicial</li>
                <li>Violar qualquer lei ou regulamentação aplicável</li>
                <li>Incorporar ou vincular a qualquer conteúdo de propriedade intelectual de terceiros</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Isenção de Responsabilidade</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text='A plataforma CurrIA é fornecida "no estado em que se encontra". CurrIA não oferece garantias de qualquer tipo, expressas ou implícitas. CurrIA renuncia a todas as garantias, expressas ou implícitas, incluindo, mas não limitado a, garantias de comercialização, adequação a um fim específico e não violação.'
                  className="font-medium text-foreground"
                />
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text="Em nenhum caso CurrIA será responsável por qualquer dano direto, indireto, incidental, especial ou consequencial resultante de seu acesso ou uso da plataforma, mesmo que CurrIA tenha sido informado da possibilidade de tais danos."
                  className="font-medium text-foreground"
                />
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Alterações aos Termos</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text="CurrIA se reserva o direito de modificar estes termos de serviço a qualquer momento. As alterações entram em vigor imediatamente após a publicação na plataforma. Seu uso contínuo da plataforma após tais alterações constitui sua aceitação dos novos termos."
                  className="font-medium text-foreground"
                />
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Lei Aplicável</h2>
              <p className="text-muted-foreground">
                Estes termos e todas as questões relacionadas são regidas pelas leis da República Federativa do Brasil.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Entre em Contato</h2>
              <p className="text-muted-foreground">
                Se você tiver dúvidas sobre estes termos de serviço, entre em contato conosco em{" "}
                <a href="mailto:support@curria.com.br" className="text-primary hover:underline">
                  support@curria.com.br
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
