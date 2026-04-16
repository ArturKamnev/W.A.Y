from django.core.management.base import BaseCommand
from django.db import transaction

from way_api.models import Profession, TestQuestion, TestQuestionOption, User


PROFESSIONS = [
    ("ux-designer", "UX-дизайнер", "UX Designer", "Проектирует цифровой опыт вокруг реальных потребностей людей.", "Designs digital experiences around real human needs.", "creative", ["research", "visualThinking", "communication"], ["creativeSystems"], ["design", "creative", "research", "visual", "empathy"]),
    ("frontend-developer", "Frontend-разработчик", "Frontend Developer", "Создает видимую часть сайтов и приложений.", "Builds the visible parts of websites and apps.", "technology", ["logic", "interfaceDesign", "problemSolving"], ["digitalBuilder"], ["technology", "logic", "building", "digital", "deepFocus"]),
    ("data-analyst", "Аналитик данных", "Data Analyst", "Находит закономерности в информации и объясняет их значение.", "Finds patterns in information and explains what they mean.", "technology", ["analysis", "statistics", "storytelling"], ["patternFinder"], ["analysis", "logic", "statistics", "patterns", "business"]),
    ("research-scientist", "Исследователь", "Research Scientist", "Изучает вопросы через наблюдения, данные и эксперименты.", "Investigates questions through study and experiments.", "science", ["curiosity", "precision", "experimentation"], ["deepResearch"], ["research", "science", "experiments", "precision", "discovery"]),
    ("product-manager", "Product-менеджер", "Product Manager", "Соединяет потребности людей, цели продукта и работу команды.", "Connects user needs, business goals, and team execution.", "business", ["strategy", "communication", "prioritization"], ["directionSetter"], ["business", "leadership", "strategy", "communication", "planning"]),
    ("psychologist-educator", "Психолог-педагог", "Psychologist Educator", "Поддерживает обучение, рефлексию и здоровое развитие.", "Supports learning, reflection, and healthy growth.", "social", ["empathy", "listening", "ethics"], ["peopleInsight"], ["empathy", "listening", "people", "social", "impact"]),
    ("teacher-mentor", "Учитель или наставник", "Teacher or Mentor", "Помогает другим понимать идеи и развивать уверенность.", "Helps others understand ideas and grow confidence.", "social", ["teaching", "patience", "communication"], ["explainer"], ["teaching", "communication", "social", "storytelling", "empathy"]),
    ("medical-specialist", "Медицинский специалист", "Medical Specialist", "Использует науку и заботу для здоровья людей.", "Uses science and care to protect people's health.", "health", ["precision", "empathy", "resilience"], ["carePrecision"], ["science", "precision", "empathy", "lab", "focus"]),
    ("entrepreneur", "Предприниматель", "Entrepreneur", "Создает решения, проверяет идеи и развивает проекты.", "Creates solutions, tests ideas, and builds projects.", "business", ["leadership", "sales", "problemSolving"], ["builderLeader"], ["business", "leadership", "growth", "market", "fastPaced"]),
]

QUESTION_TAGS = [
    ("interests", ["research", "science"]),
    ("interests", ["design", "creative"]),
    ("interests", ["people", "communication"]),
    ("interests", ["systems", "technology"]),
    ("interests", ["business", "leadership"]),
    ("strengths", ["analysis", "logic"]),
    ("strengths", ["empathy", "social"]),
    ("strengths", ["visual", "creative"]),
    ("strengths", ["planning", "operations"]),
    ("strengths", ["precision", "science"]),
    ("workStyle", ["independent", "research"]),
    ("workStyle", ["teamwork", "communication"]),
    ("workStyle", ["fastPaced", "business"]),
    ("workStyle", ["deepFocus", "technology"]),
    ("workStyle", ["structure", "operations"]),
    ("communication", ["presentation", "leadership"]),
    ("communication", ["listening", "empathy"]),
    ("communication", ["writing", "creative"]),
    ("communication", ["negotiation", "business"]),
    ("communication", ["teaching", "social"]),
    ("logicCreativity", ["logic", "technology"]),
    ("logicCreativity", ["creative", "design"]),
    ("logicCreativity", ["experiments", "science"]),
    ("logicCreativity", ["strategy", "business"]),
    ("logicCreativity", ["storytelling", "creative"]),
    ("environment", ["studio", "design"]),
    ("environment", ["lab", "science"]),
    ("environment", ["digital", "technology"]),
    ("environment", ["community", "social"]),
    ("environment", ["market", "business"]),
    ("motivation", ["impact", "social"]),
    ("motivation", ["building", "technology"]),
    ("motivation", ["discovery", "science"]),
    ("motivation", ["expression", "creative"]),
    ("motivation", ["growth", "leadership"]),
]

QUESTION_TEXT_RU = {
    1: "Мне интересно исследовать, как устроен мир.",
    2: "Мне нравится придумывать визуальные идеи и решения.",
    3: "Мне важно понимать людей и общаться с ними.",
    4: "Мне интересно собирать системы, технологии или механизмы.",
    5: "Мне нравится брать ответственность и вести идею вперед.",
    6: "Мне легко замечать закономерности и делать выводы.",
    7: "Я хорошо чувствую настроение и потребности других людей.",
    8: "Мне нравится мыслить образами, формой и цветом.",
    9: "Мне комфортно планировать шаги и доводить задачи до порядка.",
    10: "Мне нравится работать точно и внимательно к деталям.",
}


class Command(BaseCommand):
    help = "Seed W.A.Y. demo professions, questions, and local users."

    def handle(self, *args, **options):
        with transaction.atomic():
            self.stdout.write("Seeding professions...")
            Profession.objects.bulk_create(
                [
                    Profession(
                        slug=slug,
                        title_ru=title_ru,
                        title_en=title_en,
                        description_ru=description_ru,
                        description_en=description_en,
                        category=category,
                        skills=skills,
                        fit_tags=fit_tags,
                        details={"skills": skills, "firstSteps": [], "relatedIds": []},
                        scoring_tags=scoring_tags,
                    )
                    for slug, title_ru, title_en, description_ru, description_en, category, skills, fit_tags, scoring_tags in PROFESSIONS
                ],
                update_conflicts=True,
                unique_fields=["slug"],
                update_fields=[
                    "title_ru",
                    "title_en",
                    "description_ru",
                    "description_en",
                    "category",
                    "skills",
                    "fit_tags",
                    "details",
                    "scoring_tags",
                ],
            )

            self.stdout.write("Seeding career-test questions...")
            TestQuestion.objects.bulk_create(
                [
                    TestQuestion(
                        sort_order=index,
                        category=category,
                        text_ru=QUESTION_TEXT_RU.get(index, f"Утверждение {index}"),
                        text_en=f"Question {index}",
                    )
                    for index, (category, _tags) in enumerate(QUESTION_TAGS, start=1)
                ],
                update_conflicts=True,
                unique_fields=["sort_order"],
                update_fields=["category", "text_ru", "text_en"],
            )

            questions_by_order = {question.sort_order: question for question in TestQuestion.objects.filter(sort_order__in=range(1, len(QUESTION_TAGS) + 1))}
            option_rows = []
            for index, (_category, tags) in enumerate(QUESTION_TAGS, start=1):
                question = questions_by_order[index]
                options = [
                    ("Не очень про меня", "Not really me", 1, []),
                    ("Иногда верно", "Sometimes true", 2, tags[:1]),
                    ("Часто верно", "Often true", 3, tags),
                    ("Очень про меня", "Very much me", 4, tags),
                ]
                option_rows.extend(
                    TestQuestionOption(
                        question=question,
                        sort_order=option_index,
                        label_ru=label_ru,
                        label_en=label_en,
                        value=value,
                        scoring_payload={"tags": option_tags},
                    )
                    for option_index, (label_ru, label_en, value, option_tags) in enumerate(options, start=1)
                )
            TestQuestionOption.objects.bulk_create(
                option_rows,
                update_conflicts=True,
                unique_fields=["question", "sort_order"],
                update_fields=["label_ru", "label_en", "value", "scoring_payload"],
            )

            self.stdout.write("Seeding demo users...")
            self._upsert_user(
                email="admin@way.local",
                password="Admin12345!",
                name="W.A.Y. Admin",
                role=User.Role.ADMIN,
                grade_or_age="Production 10A",
                preferred_language="ru",
                is_staff=True,
                is_superuser=True,
            )
            self._upsert_user(
                email="student@way.local",
                password="Student12345!",
                name="Амина",
                role=User.Role.USER,
                grade_or_age="10A",
                preferred_language="ru",
                is_staff=False,
                is_superuser=False,
            )

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _upsert_user(self, *, email, password, name, role, grade_or_age, preferred_language, is_staff, is_superuser):
        user, _created = User.objects.update_or_create(
            email=email,
            defaults={
                "username": email,
                "name": name,
                "role": role,
                "grade_or_age": grade_or_age,
                "preferred_language": preferred_language,
                "is_active": True,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            },
        )
        user.set_password(password)
        user.save(update_fields=["password", "updated_at"])
