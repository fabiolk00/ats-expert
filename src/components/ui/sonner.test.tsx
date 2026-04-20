import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const sonnerMock = vi.fn(({ closeButton, style }: { closeButton?: boolean; style?: React.CSSProperties }) => (
  <div
    data-testid="mock-sonner"
    data-close-button={String(closeButton)}
    data-bg={style?.["--normal-bg" as keyof React.CSSProperties] as string}
    data-text={style?.["--normal-text" as keyof React.CSSProperties] as string}
    data-border={style?.["--normal-border" as keyof React.CSSProperties] as string}
  />
))

vi.mock("sonner", () => ({
  Toaster: (props: unknown) => sonnerMock(props as never),
}))

import { Toaster } from "./sonner"

describe("Toaster", () => {
  it("uses a black info surface and enables manual close", () => {
    render(<Toaster />)

    const toaster = screen.getByTestId("mock-sonner")
    expect(toaster).toHaveAttribute("data-close-button", "true")
    expect(toaster).toHaveAttribute("data-bg", "#050505")
    expect(toaster).toHaveAttribute("data-text", "#ffffff")
    expect(toaster).toHaveAttribute("data-border", "#1f1f1f")
  })
})
