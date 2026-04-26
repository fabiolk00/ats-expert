import {
  buildFaqPageJsonLd,
  type SeoFaqItem,
} from "@/lib/seo/json-ld"

type FaqJsonLdProps = {
  items: readonly SeoFaqItem[]
}

export function FaqJsonLd({ items }: FaqJsonLdProps) {
  if (items.length === 0) {
    return null
  }

  const schema = buildFaqPageJsonLd(items)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}
