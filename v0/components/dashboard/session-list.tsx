import SessionCard from "@/components/session-card"

type Phase = 'intake' | 'analysis' | 'dialog' | 'confirm' | 'generation'

interface Session {
  id: string
  phase: Phase
  atsScore?: number
  createdAt: string
}

interface SessionListProps {
  sessions: Session[]
}

export default function SessionList({ sessions }: SessionListProps) {
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  )
}
