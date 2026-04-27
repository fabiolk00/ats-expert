export type ValidationOverrideCta = {
  label: string
  action: 'override_generate' | 'open_pricing_modal'
  disabled?: boolean
  helperText?: string
}

function formatCreditLabel(creditCost: number): string {
  return `${creditCost} ${creditCost === 1 ? 'crédito' : 'créditos'}`
}

export function resolveValidationOverrideCta(args: {
  creditCost: number
  availableCredits: number | null | undefined
  isOverrideLoading: boolean
}): ValidationOverrideCta {
  const availableCredits = args.availableCredits ?? 0

  if (args.isOverrideLoading) {
    return {
      label: 'Gerando...',
      action: 'override_generate',
      disabled: true,
    }
  }

  if (availableCredits < args.creditCost) {
    return {
      label: 'Adicionar créditos',
      action: 'open_pricing_modal',
      helperText: `Você precisa de ${formatCreditLabel(args.creditCost)} para gerar esta versão.`,
    }
  }

  return {
    label: `Gerar mesmo assim (${formatCreditLabel(args.creditCost)})`,
    action: 'override_generate',
    helperText: `Você usará ${formatCreditLabel(args.creditCost)} para gerar esta versão.`,
  }
}
