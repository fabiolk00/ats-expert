import { describe, expect, it } from "vitest"

import { embeddedClerkAppearance } from "./clerk-appearance"

describe("embeddedClerkAppearance", () => {
  it("keeps the safe shared auth chrome overrides", () => {
    expect(embeddedClerkAppearance.elements.card).toContain("bg-transparent")
    expect(embeddedClerkAppearance.elements.formButtonPrimary).toContain("rounded-xl")
    expect(embeddedClerkAppearance.elements.formFieldLabel).toContain("text-sm")
    expect(embeddedClerkAppearance.elements.socialButtonsBlockButton).toContain("h-12")
    expect(embeddedClerkAppearance.elements.footer).toBe("hidden")
  })
})
