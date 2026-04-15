import { mockProfessions } from '../data/mockData'
import type { Profession, ProfessionFilters } from '../types/models'

const wait = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms))

export const professionService = {
  async listProfessions(filters: ProfessionFilters = {}): Promise<Profession[]> {
    await wait()
    const query = filters.query?.trim().toLowerCase()

    return mockProfessions.filter((profession) => {
      const categoryMatches = !filters.category || filters.category === 'all' || profession.category === filters.category
      const queryMatches =
        !query ||
        profession.id.includes(query) ||
        profession.category.includes(query) ||
        profession.titleKey.toLowerCase().includes(query) ||
        profession.skillsKeys.some((skill) => skill.toLowerCase().includes(query))

      return categoryMatches && queryMatches
    })
  },

  async getProfession(id: string): Promise<Profession | undefined> {
    await wait()
    return mockProfessions.find((profession) => profession.id === id)
  },

  async saveProfession(professionId: string): Promise<{ saved: boolean; professionId: string }> {
    await wait(80)
    return { saved: true, professionId }
  },

  async removeProfession(professionId: string): Promise<void> {
    void professionId
    await wait(80)
  },

  async listSavedProfessions(): Promise<Profession[]> {
    await wait(80)
    return mockProfessions.slice(0, 2)
  },
}
