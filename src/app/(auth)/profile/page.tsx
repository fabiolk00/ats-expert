import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Meu Perfil - CurrIA',
  description: 'Configure seu perfil profissional no CurrIA',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ProfilePage() {
  redirect('/dashboard/resumes/new')
}
