from concurrent.futures import ThreadPoolExecutor

from django.db import transaction
from django.utils import timezone

from way_api.models import Profession, ResultRecommendation, TestAnswer, TestAttempt, TestQuestionOption, TestResult
from way_api.services.groq import result_interpretation
from way_api.services.scoring import build_result, recommendation_reason


def create_result_from_option_ids(user, option_ids, attempt_id=None):
    selected_options = list(TestQuestionOption.objects.select_related("question").filter(id__in=option_ids))
    return create_result(user, selected_options, attempt_id=attempt_id)


def create_result(user, selected_options, attempt_id=None):
    if not selected_options:
        raise ValueError("No valid answers submitted")

    with transaction.atomic():
        if attempt_id:
            attempt = TestAttempt.objects.filter(id=attempt_id, user=user).first()
            if not attempt:
                raise ValueError("Attempt not found")
        else:
            attempt = TestAttempt.objects.create(user=user)

        for option in selected_options:
            TestAnswer.objects.update_or_create(
                attempt=attempt,
                question=option.question,
                defaults={
                    "selected_option": option,
                    "numeric_value": option.value,
                    "payload_snapshot": option.scoring_payload,
                },
            )

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
            user=user,
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

    return result
