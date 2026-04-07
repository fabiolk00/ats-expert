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
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="mt-2 text-gray-600">
            Configure seu perfil profissional para acelerar a criação de novos currículos
          </p>
        </div>

        <ProfileForm />

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Como funciona?</h2>
          <ol className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                1
              </span>
              <span>
                Conecte seu perfil do LinkedIn para importar seus dados profissionais automaticamente
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                2
              </span>
              <span>
                Seus dados serão salvos como um perfil padrão que usaremos em todos os novos currículos
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                3
              </span>
              <span>
                Você ainda pode editar cada currículo individualmente dentro do chat com a IA
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
