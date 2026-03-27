import type {
  CVContactDiff,
  CVListItemDiff,
  CVSkillsDiff,
  CVStateDiff,
  CVSummaryDiff,
  CertificationEntry,
  CVState,
  EducationEntry,
  ExperienceEntry,
} from '@/types/cv'

type ContactField = 'fullName' | 'email' | 'phone' | 'linkedin' | 'location'

const CONTACT_FIELDS: ContactField[] = ['fullName', 'email', 'phone', 'linkedin', 'location']

function areEqual<T>(left: T, right: T): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function diffContact(before: CVState, after: CVState): CVContactDiff | undefined {
  const changedFields = CONTACT_FIELDS.filter((field) => before[field] !== after[field])

  if (changedFields.length === 0) {
    return undefined
  }

  return {
    before: {
      fullName: before.fullName,
      email: before.email,
      phone: before.phone,
      linkedin: before.linkedin,
      location: before.location,
    },
    after: {
      fullName: after.fullName,
      email: after.email,
      phone: after.phone,
      linkedin: after.linkedin,
      location: after.location,
    },
    changedFields,
  }
}

function diffSummary(before: string, after: string): CVSummaryDiff | undefined {
  if (before === after) {
    return undefined
  }

  return {
    before,
    after,
    changed: true,
  }
}

function diffSkills(before: string[], after: string[]): CVSkillsDiff | undefined {
  const beforeSet = new Set(before)
  const afterSet = new Set(after)
  const added = [...afterSet].filter((skill) => !beforeSet.has(skill))
  const removed = [...beforeSet].filter((skill) => !afterSet.has(skill))
  const unchangedCount = [...beforeSet].filter((skill) => afterSet.has(skill)).length

  if (added.length === 0 && removed.length === 0) {
    return undefined
  }

  return {
    added,
    removed,
    unchangedCount,
  }
}

function diffListItems<T>(
  before: T[],
  after: T[],
  getKey: (item: T) => string,
): CVListItemDiff<T> | undefined {
  const beforeByKey = new Map(before.map((item) => [getKey(item), item]))
  const afterByKey = new Map(after.map((item) => [getKey(item), item]))
  const added: T[] = []
  const removed: T[] = []
  const changed: Array<{ before: T; after: T }> = []
  let unchangedCount = 0

  for (const item of before) {
    const key = getKey(item)
    const matchingItem = afterByKey.get(key)

    if (!matchingItem) {
      removed.push(item)
      continue
    }

    if (areEqual(item, matchingItem)) {
      unchangedCount += 1
      continue
    }

    changed.push({
      before: item,
      after: matchingItem,
    })
  }

  for (const item of after) {
    const key = getKey(item)
    if (!beforeByKey.has(key)) {
      added.push(item)
    }
  }

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    return undefined
  }

  return {
    added,
    removed,
    changed,
    unchangedCount,
  }
}

function getExperienceKey(entry: ExperienceEntry): string {
  return [
    entry.title,
    entry.company,
    entry.location ?? '',
    entry.startDate,
    entry.endDate,
  ].join('|')
}

function getEducationKey(entry: EducationEntry): string {
  return [
    entry.degree,
    entry.institution,
    entry.year,
  ].join('|')
}

function getCertificationKey(entry: CertificationEntry): string {
  return [
    entry.name,
    entry.issuer,
    entry.year ?? '',
  ].join('|')
}

export function compareCVStates(before: CVState, after: CVState): CVStateDiff {
  const diff: CVStateDiff = {}

  const contact = diffContact(before, after)
  if (contact) {
    diff.contact = contact
  }

  const summary = diffSummary(before.summary, after.summary)
  if (summary) {
    diff.summary = summary
  }

  const skills = diffSkills(before.skills, after.skills)
  if (skills) {
    diff.skills = skills
  }

  const experience = diffListItems(before.experience, after.experience, getExperienceKey)
  if (experience) {
    diff.experience = experience
  }

  const education = diffListItems(before.education, after.education, getEducationKey)
  if (education) {
    diff.education = education
  }

  const certifications = diffListItems(
    before.certifications ?? [],
    after.certifications ?? [],
    getCertificationKey,
  )
  if (certifications) {
    diff.certifications = certifications
  }

  return diff
}
