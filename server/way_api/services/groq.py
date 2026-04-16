import json
import re

import requests
from django.conf import settings


def strip_emoji(value: str) -> str:
    return re.sub(r"[\U00010000-\U0010ffff]", "", value).strip()


def guide_reply(language: str, user_message: str, profile_context: str | None = None) -> str:
    fallback = (
        "Давайте спокойно разложим это на один вопрос и один маленький следующий шаг."
        if language == "ru"
        else "Let us turn this into one question and one small next step."
    )
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "change_me":
        return fallback

    try:
        response = requests.post(
            f"{settings.GROQ_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
            timeout=8,
            json={
                "model": settings.GROQ_MODEL,
                "temperature": 0.35,
                "max_tokens": 420,
                "messages": [
                    {"role": "system", "content": "You are W.A.Y. Guide. Be concise, supportive, practical, and safe. No emojis."},
                    {"role": "user", "content": f"Language: {language}. Context: {profile_context or 'none'}. Student message: {user_message}"},
                ],
            },
        )
        response.raise_for_status()
        return strip_emoji(response.json()["choices"][0]["message"]["content"])
    except Exception:
        return fallback


def deterministic_explanation(language: str, result: dict) -> dict:
    primary = result["primary"]
    alternatives = [{"slug": item.profession.slug, "matchPercent": item.match_percent} for item in result["alternatives"]]
    traits = ", ".join(item["ru" if language == "ru" else "en"] for item in result["strengths"])
    return {
        "primaryProfessionSlug": primary.profession.slug,
        "primaryMatchPercent": primary.match_percent,
        "alternatives": alternatives,
        "summary": (
            f"Самое сильное совпадение - {primary.profession.title_ru}. Результат основан на ваших ответах и заметных признаках: {traits}."
            if language == "ru"
            else f"The strongest match is {primary.profession.title_en}. The result is based on your answers and strongest signals: {traits}."
        ),
        "reasoning": (
            [
                "Профессии выбраны из каталога W.A.Y. по совпадению с вашим профилем.",
                "Проценты рассчитаны до AI-этапа и не изменяются моделью.",
                "Дополнительные варианты раскрывают близкие, но разные рабочие среды.",
            ]
            if language == "ru"
            else [
                "Professions are selected from the W.A.Y. catalog by matching your profile.",
                "Percentages are calculated before the AI step and are not changed by the model.",
                "Additional options show close but different work environments.",
            ]
        ),
    }


def result_interpretation(language: str, result: dict) -> dict:
    fallback = deterministic_explanation(language, result)
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "change_me":
        return fallback

    locked = {
        "primaryProfessionSlug": result["primary"].profession.slug,
        "primaryMatchPercent": result["primary"].match_percent,
        "alternatives": [{"slug": item.profession.slug, "matchPercent": item.match_percent} for item in result["alternatives"]],
        "dominantTraits": result["strengths"],
        "recommendations": [
            {"slug": item.profession.slug, "titleRu": item.profession.title_ru, "titleEn": item.profession.title_en, "matchPercent": item.match_percent}
            for item in result["recommendations"]
        ],
    }

    for _attempt in range(2):
        try:
            response = requests.post(
                f"{settings.GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                timeout=5,
                json={
                    "model": settings.GROQ_MODEL,
                    "temperature": 0.18,
                    "max_tokens": 520,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": "Return valid JSON only. No markdown. No emojis. Do not change slugs or percentages."},
                        {"role": "user", "content": f"Language: {language}. Locked result data: {json.dumps(locked, ensure_ascii=False)}"},
                    ],
                },
            )
            response.raise_for_status()
            parsed = json.loads(response.json()["choices"][0]["message"]["content"])
            parsed["summary"] = strip_emoji(str(parsed.get("summary", "")))
            parsed["reasoning"] = [strip_emoji(str(item)) for item in parsed.get("reasoning", [])][:3]
            if parsed.get("primaryProfessionSlug") != fallback["primaryProfessionSlug"]:
                continue
            if parsed.get("primaryMatchPercent") != fallback["primaryMatchPercent"]:
                continue
            if parsed.get("alternatives") != fallback["alternatives"]:
                continue
            if len(parsed["summary"]) < 20 or len(parsed["reasoning"]) < 2:
                continue
            return parsed
        except Exception:
            continue
    return fallback
