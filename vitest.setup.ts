import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

class IntersectionObserverMock {
  readonly root = null
  readonly rootMargin = ""
  readonly thresholds = []

  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

global.IntersectionObserver = IntersectionObserverMock as typeof IntersectionObserver
