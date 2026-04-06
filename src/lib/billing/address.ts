export const BRAZIL_STATE_CODES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

const BRAZIL_STATE_CODE_SET = new Set<string>(BRAZIL_STATE_CODES)

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function normalizePhoneNumber(value: string): string {
  const digits = onlyDigits(value)

  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2)
  }

  return digits
}

export function isValidBrazilPhoneNumberInput(value: string): boolean {
  const digits = normalizePhoneNumber(value)
  return digits.length === 10 || digits.length === 11
}

export function normalizePostalCode(value: string): string {
  return onlyDigits(value)
}

export function isValidPostalCodeInput(value: string): boolean {
  const digits = onlyDigits(value)
  return digits.length === 8
}

export function normalizeProvince(value: string): string {
  return value.trim().toUpperCase()
}

export function isValidBrazilStateCode(value: string): boolean {
  return BRAZIL_STATE_CODE_SET.has(normalizeProvince(value))
}
