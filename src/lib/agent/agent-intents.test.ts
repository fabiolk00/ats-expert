import { describe, expect, it } from 'vitest'

import { isWeakFitContinueRequest } from './agent-intents'

describe('agent weak-fit continue intent', () => {
  it('recognizes the explicit continue phrases used by the weak-fit modal', () => {
    expect(isWeakFitContinueRequest('Continuar mesmo assim')).toBe(true)
    expect(isWeakFitContinueRequest('Quero continuar mesmo assim')).toBe(true)
    expect(isWeakFitContinueRequest('Prosseguir mesmo assim')).toBe(true)
  })

  it('does not treat cancel-style phrases as continue approval', () => {
    expect(isWeakFitContinueRequest('Cancelar')).toBe(false)
    expect(isWeakFitContinueRequest('Depois')).toBe(false)
    expect(isWeakFitContinueRequest('Não agora')).toBe(false)
  })
})
