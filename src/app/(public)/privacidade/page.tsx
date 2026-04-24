import type { Metadata } from "next"

import { BrandText } from "@/components/brand-wordmark"
import { buildPublicPageMetadata } from "@/lib/seo/public-metadata"

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Política de Privacidade - CurrIA",
  description: "Política de privacidade e proteção de dados pessoais da plataforma CurrIA.",
  canonicalPath: "/privacidade",
})

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade</h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Introdução</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text='CurrIA ("nós", "nosso" ou "empresa") opera a plataforma CurrIA (o "Serviço"). Esta página informa você de nossas políticas em relação à coleta, uso e divulgação de dados pessoais quando você usa nosso Serviço e as opções que você tem associadas a esses dados.'
                  className="font-medium text-foreground"
                />
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Coleta e Uso de Informações</h2>
              <p className="text-muted-foreground">
                Coletamos vários tipos de informações para fins diversos, a fim de fornecer e melhorar nosso Serviço.
              </p>
              <h3 className="text-lg font-semibold">Tipos de Dados Coletados:</h3>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                <li>Dados pessoais (nome, endereço de e-mail, número de telefone)</li>
                <li>Informações de perfil e currículo</li>
                <li>Dados de uso e análise</li>
                <li>Informações de cookies e tecnologias similares</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Segurança da Informação</h2>
              <p className="text-muted-foreground">
                A segurança de seus dados pessoais é importante para nós, mas lembre-se de que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Embora nos esforçamos para usar meios comercialmente aceitáveis para proteger seus dados pessoais, não podemos garantir sua segurança absoluta.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Cookies</h2>
              <p className="text-muted-foreground">
                Usamos cookies e tecnologias similares para rastrear a atividade em nosso Serviço e manter certas informações. Você pode instruir seu navegador a recusar todos os cookies ou a indicar quando um cookie está sendo enviado. No entanto, se você não aceitar cookies, você pode não ser capaz de usar algumas porções de nosso Serviço.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground">
                Não vendemos, trocamos ou transferimos seus dados pessoais para terceiros. Isso não inclui terceiros confiáveis que nos ajudam a operar nosso site e conduzir nossos negócios, desde que esses terceiros concordem em manter essas informações confidenciais.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Seus Direitos</h2>
              <p className="text-muted-foreground">
                Você tem o direito de acessar, corrigir ou deletar seus dados pessoais. Para exercer esses direitos, entre em contato conosco usando as informações de contato fornecidas abaixo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Alterações a esta Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você de quaisquer alterações postando a nova Política de Privacidade nesta página e atualizando a data &ldquo;Última atualização&rdquo; no topo desta página.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Entre em Contato</h2>
              <p className="text-muted-foreground">
                Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco em{" "}
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
