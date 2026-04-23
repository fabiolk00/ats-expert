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
            <h1 className="text-4xl font-bold tracking-tight">PolÃ­tica de Privacidade</h1>
            <p className="text-lg text-muted-foreground">
              Ãšltima atualizaÃ§Ã£o: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. IntroduÃ§Ã£o</h2>
              <p className="text-muted-foreground">
                <BrandText
                  text='CurrIA ("nÃ³s", "nosso" ou "empresa") opera a plataforma CurrIA (o "ServiÃ§o"). Esta pÃ¡gina informa vocÃª de nossas polÃ­ticas em relaÃ§Ã£o Ã  coleta, uso e divulgaÃ§Ã£o de dados pessoais quando vocÃª usa nosso ServiÃ§o e as opÃ§Ãµes que vocÃª tem associadas a esses dados.'
                  className="font-medium text-foreground"
                />
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Coleta e Uso de InformaÃ§Ãµes</h2>
              <p className="text-muted-foreground">
                Coletamos vÃ¡rios tipos de informaÃ§Ãµes para fins diversos, a fim de fornecer e melhorar nosso ServiÃ§o.
              </p>
              <h3 className="text-lg font-semibold">Tipos de Dados Coletados:</h3>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Dados pessoais (nome, endereÃ§o de e-mail, nÃºmero de telefone)</li>
                <li>InformaÃ§Ãµes de perfil e currÃ­culo</li>
                <li>Dados de uso e anÃ¡lise</li>
                <li>InformaÃ§Ãµes de cookies e tecnologias similares</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. SeguranÃ§a da InformaÃ§Ã£o</h2>
              <p className="text-muted-foreground">
                A seguranÃ§a de seus dados pessoais Ã© importante para nÃ³s, mas lembre-se de que nenhum mÃ©todo de transmissÃ£o pela Internet ou mÃ©todo de armazenamento eletrÃ´nico Ã© 100% seguro. Embora nos esforÃ§amos para usar meios comercialmente aceitÃ¡veis para proteger seus dados pessoais, nÃ£o podemos garantir sua seguranÃ§a absoluta.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Cookies</h2>
              <p className="text-muted-foreground">
                Usamos cookies e tecnologias similares para rastrear a atividade em nosso ServiÃ§o e manter certas informaÃ§Ãµes. VocÃª pode instruir seu navegador a recusar todos os cookies ou a indicar quando um cookie estÃ¡ sendo enviado. No entanto, se vocÃª nÃ£o aceitar cookies, vocÃª pode nÃ£o ser capaz de usar algumas porÃ§Ãµes de nosso ServiÃ§o.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground">
                NÃ£o vendemos, trocamos ou transferimos seus dados pessoais para terceiros. Isso nÃ£o inclui terceiros confiÃ¡veis que nos ajudam a operar nosso site e conduzir nossos negÃ³cios, desde que esses terceiros concordem em manter essas informaÃ§Ãµes confidenciais.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Seus Direitos</h2>
              <p className="text-muted-foreground">
                VocÃª tem o direito de acessar, corrigir ou deletar seus dados pessoais. Para exercer esses direitos, entre em contato conosco usando as informaÃ§Ãµes de contato fornecidas abaixo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. AlteraÃ§Ãµes a esta PolÃ­tica</h2>
              <p className="text-muted-foreground">
                Podemos atualizar nossa PolÃ­tica de Privacidade de tempos em tempos. Notificaremos vocÃª de quaisquer alteraÃ§Ãµes postando a nova PolÃ­tica de Privacidade nesta pÃ¡gina e atualizando a data &ldquo;Ãšltima atualizaÃ§Ã£o&rdquo; no topo desta pÃ¡gina.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Entre em Contato</h2>
              <p className="text-muted-foreground">
                Se vocÃª tiver dÃºvidas sobre esta PolÃ­tica de Privacidade, entre em contato conosco em{" "}
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
