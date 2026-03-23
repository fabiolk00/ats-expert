# Skill: Agent Loop

Auto-invoked when working on any file inside `src/lib/agent/` or `src/app/api/agent/`.

## What this skill covers
The main conversational agent loop: context building, tool dispatch, phase transitions,
and streaming the response back to the client.

## Architecture recap

```
POST /api/agent
  → validate auth + quota
  → load session from DB (phase, cv_state, last N messages)
  → build context (system prompt + history + cv_state)
  → call Claude with tools
  → stream response chunks to client
  → on tool_use block → execute tool → append tool_result → continue
  → on stop_reason = end_turn → persist updated session
```

## System prompt template
The system prompt is built dynamically from the current phase. Always include:
1. Role: "You are CurrIA, a professional Brazilian resume optimization assistant..."
2. Current phase and what it means
3. The current cv_state as a JSON block (so the agent knows what was already extracted)
4. Phase-specific instructions (see below)
5. Output format rules (when to call tools vs when to respond with text)

## Phase-specific instructions

### intake
- Ask the user to share their resume (upload or paste)
- If a file was uploaded, immediately call `parse_file`
- Once resume text is available, call `set_phase('analysis')`

### analysis
- Call `score_ats` with the extracted text
- Present the score in a friendly way: overall score, top 2-3 issues, 1 positive
- Ask if they have a specific job description to target
- Call `set_phase('dialog')` when analysis is done

### dialog
- Ask targeted questions to improve weak sections (max 2 questions per turn)
- After each answer, call `rewrite_section` for the relevant section
- Show the rewritten content and ask for feedback
- When the user is satisfied, call `set_phase('confirm')`

### confirm
- Present a final summary: score before/after, sections rewritten, keywords added
- Ask explicitly: "Should I generate your optimized resume file?"
- Only call `set_phase('generation')` after explicit user confirmation

### generation
- Call `generate_file` with the final cv_state
- Tell the user their files (PDF and DOCX) are ready
- Offer to create another version targeted at a different job description

## Tool definitions

```ts
const tools = [
  {
    name: 'parse_file',
    description: 'Extract text from an uploaded resume file (PDF, DOCX, or image).',
    input_schema: {
      type: 'object',
      properties: {
        file_base64: { type: 'string', description: 'Base64-encoded file content' },
        mime_type: {
          type: 'string',
          enum: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
          ],
        },
      },
      required: ['file_base64', 'mime_type'],
    },
  },
  {
    name: 'score_ats',
    description: 'Score a resume for ATS compatibility and return section-level feedback.',
    input_schema: {
      type: 'object',
      properties: {
        resume_text:     { type: 'string' },
        job_description: { type: 'string', description: 'Optional — improves keyword analysis' },
      },
      required: ['resume_text'],
    },
  },
  {
    name: 'rewrite_section',
    description: 'Rewrite a specific resume section to improve ATS score and impact.',
    input_schema: {
      type: 'object',
      properties: {
        section:         { type: 'string', enum: ['summary', 'experience', 'skills', 'education', 'certifications'] },
        current_content: { type: 'string' },
        instructions:    { type: 'string' },
        target_keywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['section', 'current_content', 'instructions'],
    },
  },
  {
    name: 'set_phase',
    description: 'Advance the conversation to the next phase of the agent.',
    input_schema: {
      type: 'object',
      properties: {
        phase:  { type: 'string', enum: ['intake', 'analysis', 'dialog', 'confirm', 'generation'] },
        reason: { type: 'string' },
      },
      required: ['phase'],
    },
  },
  {
    name: 'generate_file',
    description: 'Generate the final ATS-optimized DOCX and PDF files for download.',
    input_schema: {
      type: 'object',
      properties: {
        cv_state: { type: 'object', description: 'Final structured resume data' },
      },
      required: ['cv_state'],
    },
  },
]
```

## Streaming pattern
Send each text chunk as an SSE event:
```
data: {"delta": "word "}\n\n
```
On completion:
```
data: {"done": true, "sessionId": "...", "phase": "generation", "atsScore": {...}}\n\n
```

## Context window management
- Keep at most the last 12 messages in the context
- Always include the cv_state in the system prompt, not in the messages array
- If the conversation is long, summarize older turns before trimming
- Never pass rawText in the system prompt — it bloats the context

## Tool call rules for the agent
- Call tools silently — do not announce "I will now call parse_file"
- After a tool call, continue the conversation naturally based on the result
- If a tool returns `success: false`, apologize briefly and ask the user to try again
- Never call `generate_file` unless the phase is "confirm" and the user has explicitly approved
