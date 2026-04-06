import { landingFaqs } from "@/components/landing/faq-content"
import {
  buildFAQSchema,
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
} from "@/lib/seo/schema-builder"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://curria.com.br"

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function Schema() {
  const organizationSchema = buildOrganizationSchema(baseUrl)
  const softwareSchema = buildSoftwareApplicationSchema(baseUrl)
  const faqSchema = buildFAQSchema(landingFaqs)

  return (
    <>
      <JsonLdScript data={organizationSchema} />
      <JsonLdScript data={softwareSchema} />
      <JsonLdScript data={faqSchema} />
    </>
  )
}
