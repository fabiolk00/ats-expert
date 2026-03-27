import type { CVState, Phase, ATSScoreResult } from './cv'

export type { Phase }

export type Message = {
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export type Session = {
  id: string
  userId: string
  phase: Phase
  cvState: CVState
  atsScore?: ATSScoreResult
  creditsUsed: number
  messageCount: number
  creditConsumed: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Tool input/output types ───────────────────────────────────────────

export type ParseFileInput = {
  file_base64: string
  mime_type:
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'image/png'
    | 'image/jpeg'
}

export type ParseFileOutput =
  | { success: true; text: string; pageCount: number }
  | { success: false; error: string }

export type ScoreATSInput = {
  resume_text: string
  job_description?: string
}

export type ScoreATSOutput =
  | { success: true; result: ATSScoreResult }
  | { success: false; error: string }

export type RewriteSectionInput = {
  section: 'summary' | 'experience' | 'skills' | 'education' | 'certifications'
  current_content: string
  instructions: string
  target_keywords?: string[]
}

export type RewriteSectionOutput =
  | { success: true; rewritten_content: string; keywords_added: string[]; changes_made: string[] }
  | { success: false; error: string }

export type SetPhaseInput = {
  phase: Phase
  reason?: string
}

export type SetPhaseOutput =
  | { success: true; phase: Phase }
  | { success: false; error: string }

export type GenerateFileInput = {
  cv_state: CVState
}

export type GenerateFileOutput =
  | { success: true; docxUrl: string; pdfUrl: string }
  | { success: false; error: string }

// ── Agent API request/response ────────────────────────────────────────

export type AgentRequest = {
  sessionId: string
  message: string
  file?: string   // base64
  fileMime?: ParseFileInput['mime_type']
}

export type AgentStreamChunk =
  | { delta: string }
  | {
      done: true
      sessionId: string
      phase: Phase
      atsScore?: ATSScoreResult
      messageCount?: number
      maxMessages?: number
      isNewSession?: boolean
    }
  | { error: string; action?: string; messageCount?: number; maxMessages?: number; upgradeUrl?: string }
