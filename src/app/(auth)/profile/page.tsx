import { getCurrentAppUser } from '@/lib/auth/app-user'
import { ProfileForm } from './profile-form'

export const metadata = {
  title: 'Meu Perfil - CurrIA',
  description: 'Configure seu perfil profissional no CurrIA',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfilePage() {
  const appUser = await getCurrentAppUser()
  if (!appUser) {
    return null // Next.js will handle redirect for unauth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-2xl space-y-8 py-12">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Meu Perfil Profissional</h1>
          <p className="text-lg text-gray-600">
            Configure seu perfil do LinkedIn uma vez. Seus dados serão usados em todas as análises.
          </p>
        </div>

        {/* Profile Form */}
        <ProfileForm />

        {/* How it works */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Como funciona?</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">1</span>
              <span>Compartilhe seu URL do LinkedIn acima</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">2</span>
              <span>Seus dados serão extraídos automaticamente (2-10 segundos)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">3</span>
              <span>Na próxima análise, seu perfil será carregado automaticamente</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
