import type { Profession } from '@prisma/client'

const slugToCamel = (slug: string) => slug.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

export function toProfessionDto(profession: Profession) {
  const key = slugToCamel(profession.slug)
  const details = profession.details as {
    skills?: string[]
    firstSteps?: string[]
    relatedIds?: string[]
  }

  return {
    id: profession.slug,
    databaseId: profession.id,
    category: profession.category,
    titleRu: profession.titleRu,
    titleEn: profession.titleEn,
    descriptionRu: profession.descriptionRu,
    descriptionEn: profession.descriptionEn,
    titleKey: `professions.items.${key}.title`,
    descriptionKey: `professions.items.${key}.description`,
    fitTagKey: `professions.fit.${profession.fitTags[0] ?? 'creativeSystems'}`,
    skillsKeys: profession.skills.map((skill) => `skills.${skill}`),
    details: {
      doesKey: `professions.items.${key}.does`,
      suitsKey: `professions.items.${key}.suits`,
      skillsKeys: (details.skills ?? profession.skills).map((skill) => `skills.${skill}`),
      firstStepsKeys: (details.firstSteps ?? []).map((step) => `steps.${step}`),
      relatedIds: details.relatedIds ?? [],
    },
  }
}
