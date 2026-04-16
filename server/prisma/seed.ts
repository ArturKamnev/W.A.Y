import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { mockProfessions, mockQuestions, mockRoadmap } from '../../src/data/mockData.ts'

const prisma = new PrismaClient()
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

async function readLocale(language: 'ru' | 'en') {
  const file = await readFile(resolve(root, `src/i18n/locales/${language}/common.json`), 'utf8')
  return JSON.parse(file) as Record<string, unknown>
}

function pick(locale: Record<string, unknown>, key: string) {
  return key.split('.').reduce<unknown>((value, part) => {
    if (typeof value === 'object' && value && part in value) return (value as Record<string, unknown>)[part]
    return undefined
  }, locale) as string | undefined
}

const professionTags: Record<string, string[]> = {
  'ux-designer': ['design', 'creative', 'research', 'visual', 'empathy'],
  'frontend-developer': ['technology', 'logic', 'building', 'digital', 'deepFocus'],
  'data-analyst': ['analysis', 'logic', 'statistics', 'patterns', 'business'],
  'research-scientist': ['research', 'science', 'experiments', 'precision', 'discovery'],
  'product-manager': ['business', 'leadership', 'strategy', 'communication', 'planning'],
  'psychologist-educator': ['empathy', 'listening', 'people', 'social', 'impact'],
  'teacher-mentor': ['teaching', 'communication', 'social', 'storytelling', 'empathy'],
  'medical-specialist': ['science', 'precision', 'empathy', 'lab', 'focus'],
  entrepreneur: ['business', 'leadership', 'growth', 'market', 'fastPaced'],
}

async function main() {
  const [ru, en] = await Promise.all([readLocale('ru'), readLocale('en')])
  const passwordHash = await bcrypt.hash('Admin12345!', 12)
  const demoPasswordHash = await bcrypt.hash('Student12345!', 12)

  await prisma.adminAuditLog.deleteMany()
  await prisma.guideMessage.deleteMany()
  await prisma.guideConversation.deleteMany()
  await prisma.savedProfession.deleteMany()
  await prisma.resultRecommendation.deleteMany()
  await prisma.testResult.deleteMany()
  await prisma.testAnswer.deleteMany()
  await prisma.testAttempt.deleteMany()
  await prisma.testQuestionOption.deleteMany()
  await prisma.testQuestion.deleteMany()
  await prisma.profession.deleteMany()
  await prisma.user.deleteMany()

  const admin = await prisma.user.create({
    data: {
      name: 'W.A.Y. Admin',
      email: 'admin@way.local',
      passwordHash,
      role: 'admin',
      gradeOrAge: 'Production 10A',
      preferredLanguage: 'ru',
    },
  })

  const demo = await prisma.user.create({
    data: {
      name: 'Амина',
      email: 'student@way.local',
      passwordHash: demoPasswordHash,
      gradeOrAge: '10A',
      preferredLanguage: 'ru',
    },
  })

  const professionRecords = new Map<string, string>()
  for (const profession of mockProfessions) {
    const titleRu = pick(ru, profession.titleKey) ?? profession.id
    const titleEn = pick(en, profession.titleKey) ?? profession.id
    const descriptionRu = pick(ru, profession.descriptionKey) ?? ''
    const descriptionEn = pick(en, profession.descriptionKey) ?? ''
    const fitTag = profession.fitTagKey.replace('professions.fit.', '')

    const record = await prisma.profession.create({
      data: {
        slug: profession.id,
        titleRu,
        titleEn,
        descriptionRu,
        descriptionEn,
        category: profession.category,
        skills: profession.skillsKeys.map((key) => key.replace('skills.', '')),
        fitTags: [fitTag],
        details: {
          skills: profession.details.skillsKeys.map((key) => key.replace('skills.', '')),
          firstSteps: profession.details.firstStepsKeys.map((key) => key.replace('steps.', '')),
          relatedIds: profession.details.relatedIds,
        },
        scoringTags: professionTags[profession.id] ?? [],
      },
    })
    professionRecords.set(profession.id, record.id)
  }

  for (let index = 0; index < mockQuestions.length; index += 1) {
    const question = mockQuestions[index]
    await prisma.testQuestion.create({
      data: {
        category: question.category,
        sortOrder: index + 1,
        textRu: pick(ru, question.promptKey) ?? question.promptKey,
        textEn: pick(en, question.promptKey) ?? question.promptKey,
        options: {
          create: question.options.map((option, optionIndex) => ({
            labelRu: pick(ru, option.labelKey) ?? option.labelKey,
            labelEn: pick(en, option.labelKey) ?? option.labelKey,
            value: option.value,
            scoringPayload: { tags: option.tags },
            sortOrder: optionIndex + 1,
          })),
        },
      },
    })
  }

  await prisma.savedProfession.create({
    data: { userId: demo.id, professionId: professionRecords.get('ux-designer')! },
  })

  await prisma.guideConversation.create({
    data: {
      userId: demo.id,
      title: 'guide.conversations.first.title',
      messages: {
        create: [
          {
            role: 'assistant',
            content: 'Расскажите, что сейчас кажется неясным. Мы превратим это в один спокойный следующий вопрос.',
          },
          {
            role: 'user',
            content: 'Я чувствую растерянность',
          },
        ],
      },
    },
  })

  const attempt = await prisma.testAttempt.create({
    data: { userId: demo.id, status: 'completed', completedAt: new Date() },
  })
  const ux = await prisma.profession.findUniqueOrThrow({ where: { slug: 'ux-designer' } })
  const frontend = await prisma.profession.findUniqueOrThrow({ where: { slug: 'frontend-developer' } })
  await prisma.testResult.create({
    data: {
      userId: demo.id,
      attemptId: attempt.id,
      summaryRu: 'Демо-результат показывает сочетание эмпатии, визуального мышления и интереса к цифровым продуктам.',
      summaryEn: 'The demo result shows empathy, visual thinking, and interest in digital products.',
      strengths: [
        { key: 'results.strengths.empathy', ru: 'Эмпатичное общение', en: 'Empathetic communication' },
        { key: 'results.strengths.creativeSystems', ru: 'Креативное системное мышление', en: 'Creative systems thinking' },
        { key: 'results.strengths.patterns', ru: 'Поиск закономерностей', en: 'Pattern recognition' },
      ],
      workStyle: { key: 'results.workStyle', ru: 'Фокус и мягкая командная работа.', en: 'Focused work with gentle collaboration.' },
      preferredEnvironment: { key: 'results.environment', ru: 'Современные продуктовые и учебные команды.', en: 'Modern product and learning teams.' },
      recommendedDirections: [
        { key: 'results.directions.digitalProducts', ru: 'Цифровые продукты', en: 'Digital products' },
        { key: 'results.directions.humanResearch', ru: 'Исследование людей', en: 'Human research' },
      ],
      roadmap: mockRoadmap,
      aiExplanationRu: 'Это демо-объяснение можно заменить ответом Groq после добавления ключа.',
      aiExplanationEn: 'This demo explanation can be replaced by Groq after adding an API key.',
      aiReasoningRu: [
        'Демо-результат опирается на детерминированный профиль ответов.',
        'Проценты не изменяются AI-моделью.',
        'Дополнительные профессии показывают близкие, но разные траектории.',
      ],
      aiReasoningEn: [
        'The demo result is based on a deterministic answer profile.',
        'Percentages are not changed by the AI model.',
        'Additional professions show close but different trajectories.',
      ],
      recommendations: {
        create: [
          { professionId: ux.id, matchPercent: 92, reasonRu: 'Эмпатия и визуальное мышление.', reasonEn: 'Empathy and visual thinking.' },
          { professionId: frontend.id, matchPercent: 86, reasonRu: 'Интерес к цифровым продуктам.', reasonEn: 'Interest in digital products.' },
        ],
      },
    },
  })

  await prisma.adminAuditLog.create({
    data: {
      adminUserId: admin.id,
      action: 'seed.initialized',
      metadata: { demoUser: demo.email },
    },
  })

  console.log('Seed complete: admin@way.local / Admin12345!, student@way.local / Student12345!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
