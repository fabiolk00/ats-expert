import { describe, expect, it } from "vitest"

import { getLoadingTone } from "./generation-loading"

describe("getLoadingTone", () => {
  it("keeps the beginning of the loading flow in red", () => {
    expect(getLoadingTone(0)).toBe("danger")
    expect(getLoadingTone(10)).toBe("danger")
    expect(getLoadingTone(30)).toBe("danger")
  })

  it("switches the middle of the loading flow to yellow", () => {
    expect(getLoadingTone(31)).toBe("warning")
    expect(getLoadingTone(50)).toBe("warning")
  })

  it("finishes the loading flow in green", () => {
    expect(getLoadingTone(51)).toBe("success")
    expect(getLoadingTone(100)).toBe("success")
  })
})
