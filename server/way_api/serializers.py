from rest_framework import serializers

from .models import (
    GuideConversation,
    GuideMessage,
    Profession,
    ResultRecommendation,
    TestQuestion,
    TestQuestionOption,
    TestResult,
    User,
)


def slug_to_camel(slug: str) -> str:
    parts = slug.split("-")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def public_user(user: User, *, saved=None, results=None, conversations=None):
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "grade": user.grade_or_age or "",
        "preferredLanguage": user.preferred_language,
        "isActive": user.is_active,
        "avatarUrl": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
        "avatarAltKey": "profile.avatarAlt",
        "recentResultIds": [str(item.id) for item in (results or [])],
        "savedProfessionIds": [item.profession.slug for item in (saved or [])],
        "recentConversationIds": [str(item.id) for item in (conversations or [])],
        "roadmap": [],
        "createdAt": user.created_at.isoformat(),
    }


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=80)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128)
    grade = serializers.CharField(required=False, allow_blank=True, max_length=40)
    preferredLanguage = serializers.ChoiceField(choices=["ru", "en"], default="ru")


class LoginSerializer(serializers.Serializer):
    identifier = serializers.EmailField()
    password = serializers.CharField(min_length=1, max_length=128)


class ProfessionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug")
    databaseId = serializers.SerializerMethodField()
    titleKey = serializers.SerializerMethodField()
    titleRu = serializers.CharField(source="title_ru")
    titleEn = serializers.CharField(source="title_en")
    descriptionKey = serializers.SerializerMethodField()
    descriptionRu = serializers.CharField(source="description_ru")
    descriptionEn = serializers.CharField(source="description_en")
    fitTagKey = serializers.SerializerMethodField()
    skillsKeys = serializers.SerializerMethodField()
    details = serializers.SerializerMethodField()

    class Meta:
        model = Profession
        fields = [
            "id",
            "databaseId",
            "category",
            "titleKey",
            "titleRu",
            "titleEn",
            "descriptionKey",
            "descriptionRu",
            "descriptionEn",
            "fitTagKey",
            "skillsKeys",
            "details",
        ]

    def get_databaseId(self, obj):
        return str(obj.id)

    def get_titleKey(self, obj):
        return f"professions.items.{slug_to_camel(obj.slug)}.title"

    def get_descriptionKey(self, obj):
        return f"professions.items.{slug_to_camel(obj.slug)}.description"

    def get_fitTagKey(self, obj):
        fit_tag = (obj.fit_tags or ["creativeSystems"])[0]
        return f"professions.fit.{fit_tag}"

    def get_skillsKeys(self, obj):
        return [f"skills.{skill}" for skill in obj.skills]

    def get_details(self, obj):
        details = obj.details or {}
        return {
            "doesKey": f"professions.items.{slug_to_camel(obj.slug)}.does",
            "suitsKey": f"professions.items.{slug_to_camel(obj.slug)}.suits",
            "skillsKeys": [f"skills.{skill}" for skill in details.get("skills", obj.skills)],
            "firstStepsKeys": [f"steps.{step}" for step in details.get("firstSteps", [])],
            "relatedIds": details.get("relatedIds", []),
        }


class QuestionOptionSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    labelKey = serializers.SerializerMethodField()
    labelRu = serializers.CharField(source="label_ru")
    labelEn = serializers.CharField(source="label_en")
    tags = serializers.SerializerMethodField()

    class Meta:
        model = TestQuestionOption
        fields = ["id", "labelKey", "labelRu", "labelEn", "value", "tags"]

    def get_labelKey(self, obj):
        key_by_value = {1: "low", 2: "medium", 3: "high", 4: "veryHigh"}
        return f"test.options.{key_by_value.get(obj.value, 'medium')}"

    def get_tags(self, obj):
        return (obj.scoring_payload or {}).get("tags", [])


class QuestionSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    promptKey = serializers.SerializerMethodField()
    textRu = serializers.CharField(source="text_ru")
    textEn = serializers.CharField(source="text_en")
    options = QuestionOptionSerializer(many=True)

    class Meta:
        model = TestQuestion
        fields = ["id", "category", "promptKey", "textRu", "textEn", "options"]

    def get_promptKey(self, obj):
        return f"test.questions.q{obj.sort_order}"


class ResultSerializer(serializers.ModelSerializer):
    profileTitleKey = serializers.SerializerMethodField()
    summaryKey = serializers.SerializerMethodField()
    summaryRu = serializers.SerializerMethodField()
    summaryEn = serializers.SerializerMethodField()
    reasoningRu = serializers.JSONField(source="ai_reasoning_ru")
    reasoningEn = serializers.JSONField(source="ai_reasoning_en")
    strengthsKeys = serializers.SerializerMethodField()
    strengthsText = serializers.JSONField(source="strengths")
    workStyleKey = serializers.SerializerMethodField()
    workStyleText = serializers.JSONField(source="work_style")
    environmentKey = serializers.SerializerMethodField()
    environmentText = serializers.JSONField(source="preferred_environment")
    directionKeys = serializers.SerializerMethodField()
    directionsText = serializers.JSONField(source="recommended_directions")
    recommendations = serializers.SerializerMethodField()
    primaryRecommendation = serializers.SerializerMethodField()
    alternativeRecommendations = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()

    class Meta:
        model = TestResult
        fields = [
            "id",
            "profileTitleKey",
            "summaryKey",
            "summaryRu",
            "summaryEn",
            "reasoningRu",
            "reasoningEn",
            "strengthsKeys",
            "strengthsText",
            "workStyleKey",
            "workStyleText",
            "environmentKey",
            "environmentText",
            "directionKeys",
            "directionsText",
            "primaryRecommendation",
            "alternativeRecommendations",
            "recommendations",
            "roadmap",
            "createdAt",
        ]

    def _recommendations(self, obj):
        items = obj.recommendations.select_related("profession").order_by("-match_percent")
        return [recommendation_dto(item) for item in items]

    def get_profileTitleKey(self, _obj):
        return "results.profileTitle"

    def get_summaryKey(self, _obj):
        return "results.summary"

    def get_summaryRu(self, obj):
        return obj.ai_explanation_ru or obj.summary_ru

    def get_summaryEn(self, obj):
        return obj.ai_explanation_en or obj.summary_en

    def get_strengthsKeys(self, obj):
        return [item.get("key", "results.strengths.patterns") for item in obj.strengths]

    def get_workStyleKey(self, obj):
        return obj.work_style.get("key", "results.workStyle")

    def get_environmentKey(self, obj):
        return obj.preferred_environment.get("key", "results.environment")

    def get_directionKeys(self, obj):
        return [item.get("key", "results.directions.digitalProducts") for item in obj.recommended_directions]

    def get_recommendations(self, obj):
        return self._recommendations(obj)

    def get_primaryRecommendation(self, obj):
        recommendations = self._recommendations(obj)
        return recommendations[0] if recommendations else None

    def get_alternativeRecommendations(self, obj):
        return self._recommendations(obj)[1:4]

    def get_createdAt(self, obj):
        return obj.created_at.isoformat()


def recommendation_dto(recommendation: ResultRecommendation):
    slug = recommendation.profession.slug
    return {
        "professionId": slug,
        "matchPercent": recommendation.match_percent,
        "reasonKey": f"results.reasons.{slug_to_camel(slug)}",
        "reasonRu": recommendation.reason_ru,
        "reasonEn": recommendation.reason_en,
    }


def conversation_dto(conversation: GuideConversation):
    title = conversation.title
    return {
        "id": str(conversation.id),
        "titleKey": title if title.startswith("guide.") else None,
        "title": None if title.startswith("guide.") else title,
        "topicId": "custom",
        "updatedAt": conversation.updated_at.isoformat(),
        "messages": [message_dto(message) for message in conversation.messages.all()],
    }


def message_dto(message: GuideMessage):
    return {
        "id": str(message.id),
        "role": "guide" if message.role == GuideMessage.Role.ASSISTANT else message.role,
        "content": message.content,
        "createdAt": message.created_at.isoformat(),
    }
