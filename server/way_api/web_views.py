from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from way_api.forms import LoginForm, ProfileForm, SignupForm
from way_api.i18n import LANGUAGES, normalize_language
from way_api.models import GuideConversation, GuideMessage, Profession, SavedProfession, TestQuestion, TestQuestionOption, TestResult, User
from way_api.services.groq import guide_reply
from way_api.services.results import create_result


NAV_ITEMS = [
    ("home", "nav.home", "web:home"),
    ("about", "nav.about", "web:about"),
    ("professions", "nav.professions", "web:professions"),
    ("guide", "nav.guide", "web:guide"),
]


def current_language(request):
    if "language" in request.GET:
        request.session["way_language"] = normalize_language(request.GET["language"])
    stored = request.session.get("way_language")
    if request.user.is_authenticated and getattr(request.user, "preferred_language", None) in LANGUAGES:
        return normalize_language(stored or request.user.preferred_language)
    return normalize_language(stored)


def base_context(request, active=None):
    return {
        "nav_items": NAV_ITEMS,
        "active_nav": active,
        "languages": LANGUAGES,
        "current_language": current_language(request),
    }


def home(request):
    professions = Profession.objects.all()[:3]
    return render(request, "way/home.html", {**base_context(request, "home"), "professions": professions})


def about(request):
    return render(request, "way/about.html", base_context(request, "about"))


def onboarding(request):
    return render(request, "way/onboarding.html", base_context(request, "onboarding"))


def login_view(request):
    if request.user.is_authenticated:
        return redirect("web:profile")
    form = LoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        login(request, form.cleaned_data["user"])
        return redirect(request.GET.get("next") or "web:profile")
    return render(request, "way/auth/login.html", {**base_context(request), "form": form})


def signup_view(request):
    if request.user.is_authenticated:
        return redirect("web:profile")
    form = SignupForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect("web:profile")
    return render(request, "way/auth/signup.html", {**base_context(request), "form": form})


@require_POST
def set_language(request):
    language = normalize_language(request.POST.get("language"))
    request.session["way_language"] = language
    if request.user.is_authenticated:
        request.user.preferred_language = language
        request.user.save(update_fields=["preferred_language"])
    return redirect(request.POST.get("next") or "web:home")


@require_POST
def logout_view(request):
    logout(request)
    return redirect("web:home")


def professions(request):
    queryset = Profession.objects.all()
    category = request.GET.get("category", "all")
    query = (request.GET.get("query") or "").strip()
    if category and category != "all":
        queryset = queryset.filter(category=category)
    if query:
        queryset = queryset.filter(Q(slug__icontains=query) | Q(title_ru__icontains=query) | Q(title_en__icontains=query) | Q(category__icontains=query))
    saved_ids = set()
    if request.user.is_authenticated:
        saved_ids = set(SavedProfession.objects.filter(user=request.user).values_list("profession__slug", flat=True))
    return render(
        request,
        "way/professions/list.html",
        {**base_context(request, "professions"), "professions": queryset, "category": category, "query": query, "saved_ids": saved_ids},
    )


def profession_detail(request, slug):
    profession = get_object_or_404(Profession, slug=slug)
    saved = request.user.is_authenticated and SavedProfession.objects.filter(user=request.user, profession=profession).exists()
    related = Profession.objects.filter(slug__in=(profession.details or {}).get("relatedIds", []))
    return render(request, "way/professions/detail.html", {**base_context(request, "professions"), "profession": profession, "saved": saved, "related": related})


@login_required
@require_POST
def toggle_profession(request, slug):
    profession = get_object_or_404(Profession, slug=slug)
    saved = SavedProfession.objects.filter(user=request.user, profession=profession).first()
    if saved:
        saved.delete()
        messages.info(request, "Профессия удалена из сохраненных.")
    else:
        SavedProfession.objects.create(user=request.user, profession=profession)
        messages.success(request, "Профессия сохранена.")
    return redirect(request.POST.get("next") or reverse("web:profession_detail", args=[slug]))


@login_required
def career_test(request):
    questions = TestQuestion.objects.prefetch_related("options").order_by("sort_order")
    if request.method == "POST":
        option_ids = []
        for question in questions:
            value = request.POST.get(f"question_{question.id}")
            if value:
                option_ids.append(value)
        selected_options = list(TestQuestionOption.objects.select_related("question").filter(id__in=option_ids))
        if not selected_options:
            messages.error(request, "Выберите хотя бы один вариант ответа.")
        else:
            result = create_result(request.user, selected_options)
            request.session.pop("way_test_answers", None)
            return redirect("web:result_detail", result_id=result.id)
    return render(request, "way/test.html", {**base_context(request, "test"), "questions": questions})


@login_required
def latest_result(request):
    result = TestResult.objects.filter(user=request.user).prefetch_related("recommendations__profession").first()
    if not result:
        return render(request, "way/results/empty.html", base_context(request, "results"))
    return redirect("web:result_detail", result_id=result.id)


@login_required
def result_detail(request, result_id):
    result = get_object_or_404(TestResult.objects.prefetch_related("recommendations__profession"), id=result_id, user=request.user)
    recommendations = list(result.recommendations.select_related("profession").order_by("-match_percent"))
    primary = recommendations[0] if recommendations else None
    alternatives = recommendations[1:4]
    return render(
        request,
        "way/results/detail.html",
        {**base_context(request, "results"), "result": result, "primary": primary, "alternatives": alternatives, "recommendations": recommendations},
    )


@login_required
def guide(request):
    conversation = GuideConversation.objects.filter(user=request.user).prefetch_related("messages").first()
    if not conversation:
        conversation = GuideConversation.objects.create(user=request.user, title="Первый разговор")
        GuideMessage.objects.create(
            conversation=conversation,
            role=GuideMessage.Role.ASSISTANT,
            content="Расскажите, что сейчас кажется неясным. Мы превратим это в один спокойный следующий шаг.",
        )
    conversations = GuideConversation.objects.filter(user=request.user).prefetch_related("messages")
    topics = [
        ("lost", "Я не понимаю, с чего начать."),
        ("results", "Помоги разобраться с результатом теста."),
        ("wrong", "Мне кажется, результат не совсем про меня."),
        ("plan", "Составь спокойный план на неделю."),
    ]
    return render(request, "way/guide.html", {**base_context(request, "guide"), "conversation": conversation, "conversations": conversations, "topics": topics})


@login_required
@require_POST
def guide_message(request, conversation_id):
    conversation = get_object_or_404(GuideConversation, id=conversation_id, user=request.user)
    message = (request.POST.get("message") or "").strip()
    if not message:
        return HttpResponseBadRequest("Message is required")
    user_message = GuideMessage.objects.create(conversation=conversation, role=GuideMessage.Role.USER, content=message)
    assistant = guide_reply(request.user.preferred_language, message)
    guide_message = GuideMessage.objects.create(conversation=conversation, role=GuideMessage.Role.ASSISTANT, content=assistant)
    conversation.save()
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        return JsonResponse(
            {
                "user": {"content": user_message.content, "createdAt": user_message.created_at.isoformat()},
                "guide": {"content": guide_message.content, "createdAt": guide_message.created_at.isoformat()},
            }
        )
    return redirect("web:guide")


@login_required
def profile(request):
    form = ProfileForm(request.POST or None, instance=request.user)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Профиль обновлен.")
        return redirect("web:profile")
    saved = SavedProfession.objects.filter(user=request.user).select_related("profession")
    latest = TestResult.objects.filter(user=request.user).first()
    conversations = GuideConversation.objects.filter(user=request.user)[:5]
    return render(request, "way/profile.html", {**base_context(request, "profile"), "form": form, "saved": saved, "latest": latest, "conversations": conversations})


def admin_required(view):
    @login_required
    def wrapper(request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return render(request, "way/admin/forbidden.html", base_context(request, "admin"), status=403)
        return view(request, *args, **kwargs)

    return wrapper


@admin_required
def admin_dashboard(request):
    users = User.objects.all().order_by("-created_at")[:100]
    stats = {
        "totalUsers": User.objects.count(),
        "activeUsers": User.objects.filter(is_active=True).count(),
        "completedTests": TestResult.objects.count(),
        "savedProfessions": SavedProfession.objects.count(),
        "guideConversations": GuideConversation.objects.count(),
    }
    return render(request, "way/admin/dashboard.html", {**base_context(request, "admin"), "users": users, "stats": stats})


@admin_required
@require_POST
def admin_user_status(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user.is_active = request.POST.get("is_active") == "1"
    user.save(update_fields=["is_active"])
    return redirect("web:admin")


@admin_required
@require_POST
def admin_user_role(request, user_id):
    user = get_object_or_404(User, id=user_id)
    role = request.POST.get("role")
    if role in [User.Role.USER, User.Role.ADMIN]:
        user.role = role
        user.is_staff = role == User.Role.ADMIN
        user.save(update_fields=["role", "is_staff"])
    return redirect("web:admin")


def not_found(request, exception=None):
    return render(request, "way/404.html", base_context(request), status=404)
