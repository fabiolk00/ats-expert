import { Metadata } from "next"
import ChatTopBar from "@/components/chat/chat-top-bar"
import ChatMessages from "@/components/chat/chat-messages"
import ChatInput from "@/components/chat/chat-input"

export const metadata: Metadata = {
  title: "Chat - CurrIA",
  description: "Otimize seu currículo com IA",
}

// Mock data for demonstration
const mockMessages = [
  {
    id: "1",
    role: "assistant" as const,
    content: "Olá! Sou a CurrIA, sua assistente de otimização de currículos. Envie seu currículo em PDF ou DOCX, ou cole o texto diretamente aqui para começarmos a análise.",
    timestamp: "14:30",
  },
  {
    id: "2",
    role: "user" as const,
    content: "Oi! Vou enviar meu currículo agora. Estou procurando uma vaga de desenvolvedor frontend.",
    timestamp: "14:31",
  },
  {
    id: "3",
    role: "assistant" as const,
    content: "Perfeito! Recebi seu currículo. Analisando... Seu score ATS atual é 78/100. Identifiquei algumas oportunidades de melhoria:\n\n1. Falta a palavra-chave \"React\" no resumo profissional\n2. As experiências poderiam ter mais métricas quantitativas\n3. O formato pode ser otimizado para leitura por ATS\n\nGostaria que eu sugira melhorias específicas para cada ponto?",
    timestamp: "14:32",
  },
  {
    id: "4",
    role: "user" as const,
    content: "Sim, por favor! Principalmente sobre as métricas quantitativas.",
    timestamp: "14:33",
  },
]

export default async function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  
  // In a real app, you would fetch session data based on sessionId
  const phase = "dialog" as const
  const atsScore = 78
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatTopBar phase={phase} atsScore={atsScore} />
      <ChatMessages messages={mockMessages} isTyping={false} />
      <ChatInput />
    </div>
  )
}
