from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    AdminAuditLog,
    GuideConversation,
    GuideMessage,
    Profession,
    ResultRecommendation,
    SavedProfession,
    TestAnswer,
    TestAttempt,
    TestQuestion,
    TestQuestionOption,
    TestResult,
    User,
)
from .serializers import (
    LoginSerializer,
    ProfessionSerializer,
    QuestionSerializer,
    ResultSerializer,
    SignupSerializer,
    conversation_dto,
    message_dto,
    public_user,
)
from .services.groq import guide_reply, result_interpretation
from .services.scoring import build_result, recommendation_reason


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


def session_for(user):
    token = RefreshToken.for_user(user)
    return {
        "user": public_user(user),
        "token": str(token.access_token),
        "refreshToken": str(token),
        "expiresAt": (timezone.now() + timedelta(days=7)).isoformat(),
    }


class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if User.objects.filter(email=data["email"].lower()).exists():
            return Response({"message": "Email already exists"}, status=status.HTTP_409_CONFLICT)
        user = User.objects.create_user(
            email=data["email"].lower(),
            password=data["password"],
            name=data["name"],
            grade_or_age=data.get("grade", ""),
            preferred_language=data.get("preferredLanguage", "ru"),
        )
        return Response(session_for(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = User.objects.filter(email=data["identifier"].lower(), is_active=True).first()
        if not user or not user.check_password(data["password"]):
            return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(session_for(user))


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, _request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": public_user(request.user)})


class QuestionListView(APIView):
    def get(self, _request):
        questions = TestQuestion.objects.prefetch_related("options").order_by("sort_order")
        return Response(QuestionSerializer(questions, many=True).data)


class TestSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        answers = request.data.get("answers", [])
        if not isinstance(answers, list) or not answers:
            return Response({"message": "At least one answer is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            attempt_id = request.data.get("attemptId")
            if attempt_id:
                attempt = TestAttempt.objects.filter(id=attempt_id, user=request.user).first()
                if not attempt:
                    return Response({"message": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                attempt = TestAttempt.objects.create(user=request.user)

            selected_options = []
            for answer in answers:
                option = TestQuestionOption.objects.filter(id=answer.get("optionId"), question_id=answer.get("questionId")).first()
                if not option:
                    continue
                selected_options.append(option)
                TestAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=option.question,
                    defaults={
                        "selected_option": option,
                        "numeric_value": option.value,
                        "payload_snapshot": option.scoring_payload,
                    },
                )

            if not selected_options:
                return Response({"message": "No valid answers submitted"}, status=status.HTTP_400_BAD_REQUEST)

            deterministic = build_result(selected_options, list(Profession.objects.all()))
            with ThreadPoolExecutor(max_workers=2) as executor:
                ru_future = executor.submit(result_interpretation, "ru", deterministic)
                en_future = executor.submit(result_interpretation, "en", deterministic)
                ai_ru = ru_future.result()
                ai_en = en_future.result()

            attempt.status = TestAttempt.Status.COMPLETED
            attempt.completed_at = timezone.now()
            attempt.save(update_fields=["status", "completed_at"])
            TestResult.objects.filter(attempt=attempt).delete()
            result = TestResult.objects.create(
                attempt=attempt,
                user=request.user,
                summary_ru=deterministic["summaryRu"],
                summary_en=deterministic["summaryEn"],
                strengths=deterministic["strengths"],
                work_style=deterministic["workStyle"],
                preferred_environment=deterministic["preferredEnvironment"],
                recommended_directions=deterministic["recommendedDirections"],
                roadmap=deterministic["roadmap"],
                ai_explanation_ru=ai_ru["summary"],
                ai_explanation_en=ai_en["summary"],
                ai_reasoning_ru=ai_ru["reasoning"],
                ai_reasoning_en=ai_en["reasoning"],
            )
            for item in deterministic["recommendations"]:
                reason = recommendation_reason(item)
                ResultRecommendation.objects.create(
                    result=result,
                    profession=item.profession,
                    match_percent=item.match_percent,
                    reason_ru=reason["ru"],
                    reason_en=reason["en"],
                )

        return Response(ResultSerializer(result).data, status=status.HTTP_201_CREATED)


class LatestResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result = TestResult.objects.filter(user=request.user).prefetch_related("recommendations__profession").first()
        if not result:
            return Response({"message": "No result found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResultSerializer(result).data)


class ResultDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, result_id):
        result = TestResult.objects.filter(id=result_id, user=request.user).prefetch_related("recommendations__profession").first()
        if not result:
            return Response({"message": "Result not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResultSerializer(result).data)


class ProfessionListView(APIView):
    def get(self, request):
        queryset = Profession.objects.all()
        category = request.query_params.get("category")
        query = request.query_params.get("query")
        if category and category != "all":
            queryset = queryset.filter(category=category)
        if query:
            queryset = queryset.filter(
                Q(slug__icontains=query) | Q(title_ru__icontains=query) | Q(title_en__icontains=query) | Q(category__icontains=query)
            )
        return Response(ProfessionSerializer(queryset, many=True).data)


class SavedProfessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved = SavedProfession.objects.filter(user=request.user).select_related("profession")
        return Response(ProfessionSerializer([item.profession for item in saved], many=True).data)


class ProfessionDetailView(APIView):
    def get(self, _request, slug):
        profession = Profession.objects.filter(slug=slug).first()
        if not profession:
            return Response({"message": "Profession not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProfessionSerializer(profession).data)


class SaveProfessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        slug = request.data.get("professionId")
        profession = Profession.objects.filter(slug=slug).first()
        if not profession:
            return Response({"message": "Profession not found"}, status=status.HTTP_404_NOT_FOUND)
        SavedProfession.objects.get_or_create(user=request.user, profession=profession)
        return Response({"saved": True, "professionId": profession.slug}, status=status.HTTP_201_CREATED)


class RemoveSavedProfessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, profession_id):
        profession = Profession.objects.filter(slug=profession_id).first()
        if profession:
            SavedProfession.objects.filter(user=request.user, profession=profession).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved = SavedProfession.objects.filter(user=request.user).select_related("profession")
        results = TestResult.objects.filter(user=request.user)[:5]
        conversations = GuideConversation.objects.filter(user=request.user)[:5]
        profile = public_user(request.user, saved=saved, results=results, conversations=conversations)
        profile["roadmap"] = [
            {"id": "roadmap-1", "titleKey": "results.roadmap.step1.title", "descriptionKey": "results.roadmap.step1.description", "status": "next"},
            {"id": "roadmap-2", "titleKey": "results.roadmap.step2.title", "descriptionKey": "results.roadmap.step2.description", "status": "later"},
        ]
        return Response(profile)

    def patch(self, request):
        user = request.user
        if "name" in request.data:
            user.name = request.data["name"]
        if "grade" in request.data:
            user.grade_or_age = request.data["grade"]
        if request.data.get("preferredLanguage") in ["ru", "en"]:
            user.preferred_language = request.data["preferredLanguage"]
        user.save()
        return Response(public_user(user))


TOPICS = [
    {"id": "lost", "titleKey": "guide.topics.lost", "promptKey": "guide.suggestions.lost"},
    {"id": "results", "titleKey": "guide.topics.results", "promptKey": "guide.suggestions.results"},
    {"id": "wrong", "titleKey": "guide.topics.wrong", "promptKey": "guide.suggestions.wrong"},
    {"id": "plan", "titleKey": "guide.topics.plan", "promptKey": "guide.suggestions.plan"},
]


class GuideTopicsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, _request):
        return Response(TOPICS)


class GuideConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversations = GuideConversation.objects.filter(user=request.user).prefetch_related("messages")
        if not conversations.exists():
            conversation = GuideConversation.objects.create(user=request.user, title="guide.conversations.first.title")
            GuideMessage.objects.create(
                conversation=conversation,
                role=GuideMessage.Role.ASSISTANT,
                content="Расскажите, что сейчас кажется неясным. Мы превратим это в один спокойный следующий вопрос.",
            )
            conversations = GuideConversation.objects.filter(id=conversation.id).prefetch_related("messages")
        return Response([conversation_dto(item) for item in conversations])

    def post(self, request):
        conversation = GuideConversation.objects.create(user=request.user, title=request.data.get("title") or "Новый разговор")
        return Response(conversation_dto(conversation), status=status.HTTP_201_CREATED)


class GuideMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = GuideConversation.objects.filter(id=conversation_id, user=request.user).prefetch_related("messages").first()
        if not conversation:
            return Response({"message": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response([message_dto(item) for item in conversation.messages.all()])

    def post(self, request, conversation_id):
        conversation = GuideConversation.objects.filter(id=conversation_id, user=request.user).first()
        if not conversation:
            return Response({"message": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
        message = str(request.data.get("message", "")).strip()
        if not message:
            return Response({"message": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
        assistant_content = guide_reply(request.user.preferred_language, message)
        user_message = GuideMessage.objects.create(conversation=conversation, role=GuideMessage.Role.USER, content=message)
        guide_message = GuideMessage.objects.create(conversation=conversation, role=GuideMessage.Role.ASSISTANT, content=assistant_content)
        conversation.save()
        return Response({"user": message_dto(user_message), "guide": message_dto(guide_message)}, status=status.HTTP_201_CREATED)


class AdminStatsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, _request):
        since = timezone.now() - timedelta(days=7)
        return Response(
            {
                "totalUsers": User.objects.count(),
                "activeUsers": User.objects.filter(is_active=True).count(),
                "completedTests": TestAttempt.objects.filter(status=TestAttempt.Status.COMPLETED).count(),
                "savedProfessions": SavedProfession.objects.count(),
                "guideConversations": GuideConversation.objects.count(),
                "recentSignups": User.objects.filter(created_at__gte=since).count(),
            }
        )


class AdminUsersView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        queryset = User.objects.all().order_by("-created_at")
        role = request.query_params.get("role")
        search = request.query_params.get("search")
        if role in ["user", "admin"]:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))
        return Response([public_user(user) for user in queryset[:100]])


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, _request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        payload = public_user(user)
        payload["activity"] = {
            "tests": TestAttempt.objects.filter(user=user, status=TestAttempt.Status.COMPLETED).count(),
            "savedProfessions": SavedProfession.objects.filter(user=user).count(),
            "conversations": GuideConversation.objects.filter(user=user).count(),
        }
        return Response(payload)


class AdminUserStatusView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, user_id):
        user = User.objects.get(id=user_id)
        user.is_active = bool(request.data.get("isActive"))
        user.save(update_fields=["is_active"])
        AdminAuditLog.objects.create(admin_user=request.user, action="user.status", target_user=user, metadata={"isActive": user.is_active})
        return Response(public_user(user))


class AdminUserRoleView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, user_id):
        user = User.objects.get(id=user_id)
        if request.data.get("role") in ["user", "admin"]:
            user.role = request.data["role"]
            user.is_staff = user.role == "admin"
            user.save(update_fields=["role", "is_staff"])
        AdminAuditLog.objects.create(admin_user=request.user, action="user.role", target_user=user, metadata={"role": user.role})
        return Response(public_user(user))
