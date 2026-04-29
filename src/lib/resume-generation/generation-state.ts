import type { AgentState, AgentStatePatch, Session, WorkflowMode } from '@/types/agent'
import type { CVState } from '@/types/cv'

export type GenerationWorkflowMode = Extract<WorkflowMode, 'ats_enhancement' | 'job_targeting'>

export type GenerationState = Pick<
  AgentState,
  | 'workflowMode'
  | 'targetJobDescription'
  | 'atsAnalysis'
  | 'gapAnalysis'
  | 'targetingPlan'
  | 'optimizedCvState'
  | 'highlightState'
  | 'rewriteValidation'
  | 'recoverableValidationBlock'
  | 'optimizationSummary'
  | 'atsWorkflowRun'
>

type GenerationStatePatchInput = Partial<Omit<GenerationState, 'workflowMode'>> & {
  workflowMode?: GenerationWorkflowMode
}

export function getGenerationState(session: Pick<Session, 'agentState'>): GenerationState {
  const state = session.agentState

  return {
    workflowMode: state.workflowMode,
    targetJobDescription: state.targetJobDescription,
    atsAnalysis: state.atsAnalysis,
    gapAnalysis: state.gapAnalysis,
    targetingPlan: state.targetingPlan,
    optimizedCvState: state.optimizedCvState,
    highlightState: state.highlightState,
    rewriteValidation: state.rewriteValidation,
    recoverableValidationBlock: state.recoverableValidationBlock,
    optimizationSummary: state.optimizationSummary,
    atsWorkflowRun: state.atsWorkflowRun,
  }
}

export function buildGenerationStatePatch(input: GenerationStatePatchInput): { agentState: AgentStatePatch } {
  const agentState: AgentStatePatch = {}

  if ('workflowMode' in input) {
    agentState.workflowMode = input.workflowMode
  }
  if ('targetJobDescription' in input) {
    agentState.targetJobDescription = input.targetJobDescription
  }
  if ('atsAnalysis' in input) {
    agentState.atsAnalysis = input.atsAnalysis
  }
  if ('gapAnalysis' in input) {
    agentState.gapAnalysis = input.gapAnalysis
  }
  if ('targetingPlan' in input) {
    agentState.targetingPlan = input.targetingPlan
  }
  if ('optimizedCvState' in input) {
    agentState.optimizedCvState = input.optimizedCvState
  }
  if ('highlightState' in input) {
    agentState.highlightState = input.highlightState
  }
  if ('rewriteValidation' in input) {
    agentState.rewriteValidation = input.rewriteValidation
  }
  if ('recoverableValidationBlock' in input) {
    agentState.recoverableValidationBlock = input.recoverableValidationBlock
  }
  if ('optimizationSummary' in input) {
    agentState.optimizationSummary = input.optimizationSummary
  }
  if ('atsWorkflowRun' in input) {
    agentState.atsWorkflowRun = input.atsWorkflowRun
  }

  return { agentState }
}

export function assertOptimizedCvStateReady(
  session: Pick<Session, 'id' | 'agentState'>,
): CVState {
  const optimizedCvState = session.agentState.optimizedCvState
  if (!optimizedCvState) {
    throw new Error(`Optimized CV state is not ready for resume generation session ${session.id}.`)
  }

  return optimizedCvState
}

export function resolveGenerationModeFromState(
  session: Pick<Session, 'agentState'>,
): GenerationWorkflowMode | null {
  const workflowMode = session.agentState.workflowMode
  return workflowMode === 'ats_enhancement' || workflowMode === 'job_targeting'
    ? workflowMode
    : null
}

export function hasRecoverableGenerationBlock(session: Pick<Session, 'agentState'>): boolean {
  return Boolean(
    session.agentState.recoverableValidationBlock
    || session.agentState.blockedTargetedRewriteDraft?.recoverable,
  )
}
