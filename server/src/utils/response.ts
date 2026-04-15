export function publicUser(user: {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  gradeOrAge: string | null
  preferredLanguage: string
  isActive: boolean
  createdAt: Date
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    grade: user.gradeOrAge ?? '',
    preferredLanguage: user.preferredLanguage,
    isActive: user.isActive,
    avatarUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    avatarAltKey: 'profile.avatarAlt',
    recentResultIds: [],
    savedProfessionIds: [],
    recentConversationIds: [],
    roadmap: [],
    createdAt: user.createdAt.toISOString(),
  }
}
