import { z } from 'zod'

export const ExperienceEntrySchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.union([z.string(), z.literal('present')]),
  bullets: z.array(z.string()),
})

export const EducationEntrySchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string(),
  gpa: z.string().optional(),
})

export const CertificationEntrySchema = z.object({
  name: z.string(),
  issuer: z.string(),
  year: z.string().optional(),
})

export const CVContactSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
})

export const CVStateSchema = z.object({
  fullName: CVContactSchema.shape.fullName,
  email: CVContactSchema.shape.email,
  phone: CVContactSchema.shape.phone,
  linkedin: CVContactSchema.shape.linkedin,
  location: CVContactSchema.shape.location,
  summary: z.string(),
  experience: z.array(ExperienceEntrySchema),
  skills: z.array(z.string()),
  education: z.array(EducationEntrySchema),
  certifications: z.array(CertificationEntrySchema).optional(),
})

export const GapAnalysisResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  missingSkills: z.array(z.string()),
  weakAreas: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
})
