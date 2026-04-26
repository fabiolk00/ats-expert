import { describe, expect, it } from "vitest"

import robots from "@/app/robots"

describe("robots", () => {
  it("exposes the canonical production sitemap URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.curria.com.br/"

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://www.curria.com.br/sitemap.xml",
      host: "https://www.curria.com.br",
    })
  })
})
