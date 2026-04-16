from dataclasses import dataclass
from math import sqrt


TRAITS = [
    "logic",
    "analyticalThinking",
    "creativity",
    "communication",
    "technicalInterest",
    "helpingPeople",
    "structure",
    "teamwork",
    "independence",
    "visualInterest",
    "researchOrientation",
    "leadership",
    "organization",
]

TRAIT_LABELS = {
    "logic": {"key": "results.traits.logic", "ru": "Логическое мышление", "en": "Logical thinking"},
    "analyticalThinking": {"key": "results.traits.analyticalThinking", "ru": "Аналитическое мышление", "en": "Analytical thinking"},
    "creativity": {"key": "results.traits.creativity", "ru": "Креативность", "en": "Creativity"},
    "communication": {"key": "results.traits.communication", "ru": "Коммуникация", "en": "Communication"},
    "technicalInterest": {"key": "results.traits.technicalInterest", "ru": "Интерес к технологиям", "en": "Technical interest"},
    "helpingPeople": {"key": "results.traits.helpingPeople", "ru": "Помощь людям", "en": "Helping people"},
    "structure": {"key": "results.traits.structure", "ru": "Структурность", "en": "Structure"},
    "teamwork": {"key": "results.traits.teamwork", "ru": "Командная работа", "en": "Teamwork"},
    "independence": {"key": "results.traits.independence", "ru": "Самостоятельность", "en": "Independence"},
    "visualInterest": {"key": "results.traits.visualInterest", "ru": "Визуальное мышление", "en": "Visual thinking"},
    "researchOrientation": {"key": "results.traits.researchOrientation", "ru": "Исследовательский интерес", "en": "Research orientation"},
    "leadership": {"key": "results.traits.leadership", "ru": "Лидерство", "en": "Leadership"},
    "organization": {"key": "results.traits.organization", "ru": "Организация", "en": "Organization"},
}

TAG_WEIGHTS = {
    "logic": {"logic": 1, "analyticalThinking": 0.45, "technicalInterest": 0.25},
    "analysis": {"analyticalThinking": 1, "logic": 0.55, "structure": 0.3},
    "statistics": {"analyticalThinking": 0.95, "logic": 0.55, "organization": 0.2},
    "patterns": {"analyticalThinking": 0.85, "logic": 0.65},
    "precision": {"analyticalThinking": 0.45, "structure": 0.75, "researchOrientation": 0.35},
    "technology": {"technicalInterest": 1, "logic": 0.55, "structure": 0.25},
    "systems": {"technicalInterest": 0.8, "logic": 0.7, "structure": 0.45},
    "digital": {"technicalInterest": 0.85, "visualInterest": 0.35, "logic": 0.25},
    "building": {"technicalInterest": 0.75, "logic": 0.45, "independence": 0.35},
    "deepFocus": {"independence": 0.75, "logic": 0.55, "technicalInterest": 0.35},
    "creative": {"creativity": 1, "visualInterest": 0.55, "communication": 0.2},
    "design": {"visualInterest": 1, "creativity": 0.75, "helpingPeople": 0.25},
    "visual": {"visualInterest": 1, "creativity": 0.55},
    "studio": {"creativity": 0.85, "visualInterest": 0.75, "teamwork": 0.25},
    "expression": {"creativity": 0.9, "communication": 0.55},
    "storytelling": {"communication": 0.75, "creativity": 0.6, "helpingPeople": 0.25},
    "writing": {"communication": 0.75, "creativity": 0.45, "structure": 0.25},
    "research": {"researchOrientation": 1, "analyticalThinking": 0.65, "independence": 0.25},
    "science": {"researchOrientation": 0.95, "analyticalThinking": 0.65, "structure": 0.35},
    "experiments": {"researchOrientation": 0.85, "analyticalThinking": 0.5, "creativity": 0.25},
    "discovery": {"researchOrientation": 0.9, "creativity": 0.25, "independence": 0.25},
    "lab": {"researchOrientation": 0.8, "structure": 0.55, "analyticalThinking": 0.35},
    "people": {"helpingPeople": 0.95, "communication": 0.55, "teamwork": 0.25},
    "empathy": {"helpingPeople": 1, "communication": 0.45},
    "social": {"helpingPeople": 0.85, "teamwork": 0.55, "communication": 0.3},
    "impact": {"helpingPeople": 0.8, "leadership": 0.35, "communication": 0.25},
    "listening": {"helpingPeople": 0.85, "communication": 0.6, "structure": 0.15},
    "teaching": {"communication": 0.85, "helpingPeople": 0.75, "structure": 0.25},
    "community": {"teamwork": 0.75, "helpingPeople": 0.65, "communication": 0.35},
    "communication": {"communication": 1, "teamwork": 0.35},
    "presentation": {"communication": 0.85, "leadership": 0.5},
    "negotiation": {"communication": 0.85, "leadership": 0.35, "analyticalThinking": 0.2},
    "teamwork": {"teamwork": 1, "communication": 0.45},
    "business": {"leadership": 0.75, "organization": 0.55, "communication": 0.35},
    "leadership": {"leadership": 1, "communication": 0.35, "organization": 0.25},
    "strategy": {"leadership": 0.7, "analyticalThinking": 0.5, "organization": 0.45},
    "planning": {"organization": 0.85, "structure": 0.7, "analyticalThinking": 0.25},
    "operations": {"organization": 0.8, "structure": 0.75, "analyticalThinking": 0.3},
    "market": {"leadership": 0.65, "communication": 0.45, "analyticalThinking": 0.25},
    "growth": {"leadership": 0.85, "independence": 0.45, "communication": 0.2},
    "fastPaced": {"leadership": 0.55, "independence": 0.4, "organization": 0.25},
    "independent": {"independence": 1, "researchOrientation": 0.35, "structure": 0.2},
    "structure": {"structure": 1, "organization": 0.65},
}

CATEGORY_WEIGHTS = {
    "technology": {"technicalInterest": 0.85, "logic": 0.7, "analyticalThinking": 0.45},
    "creative": {"creativity": 0.8, "visualInterest": 0.75, "communication": 0.3},
    "science": {"researchOrientation": 0.9, "analyticalThinking": 0.7, "structure": 0.45},
    "business": {"leadership": 0.75, "organization": 0.65, "communication": 0.4},
    "social": {"helpingPeople": 0.85, "communication": 0.65, "teamwork": 0.45},
    "health": {"helpingPeople": 0.7, "structure": 0.65, "researchOrientation": 0.45},
}

TRAIT_LABELS.update(
    {
        "logic": {"key": "results.traits.logic", "ru": "Логическое мышление", "en": "Logical thinking"},
        "analyticalThinking": {"key": "results.traits.analyticalThinking", "ru": "Аналитическое мышление", "en": "Analytical thinking"},
        "creativity": {"key": "results.traits.creativity", "ru": "Креативность", "en": "Creativity"},
        "communication": {"key": "results.traits.communication", "ru": "Коммуникация", "en": "Communication"},
        "technicalInterest": {"key": "results.traits.technicalInterest", "ru": "Интерес к технологиям", "en": "Technical interest"},
        "helpingPeople": {"key": "results.traits.helpingPeople", "ru": "Помощь людям", "en": "Helping people"},
        "structure": {"key": "results.traits.structure", "ru": "Структурность", "en": "Structure"},
        "teamwork": {"key": "results.traits.teamwork", "ru": "Командная работа", "en": "Teamwork"},
        "independence": {"key": "results.traits.independence", "ru": "Самостоятельность", "en": "Independence"},
        "visualInterest": {"key": "results.traits.visualInterest", "ru": "Визуальное мышление", "en": "Visual thinking"},
        "researchOrientation": {"key": "results.traits.researchOrientation", "ru": "Исследовательский интерес", "en": "Research orientation"},
        "leadership": {"key": "results.traits.leadership", "ru": "Лидерство", "en": "Leadership"},
        "organization": {"key": "results.traits.organization", "ru": "Организация", "en": "Organization"},
    }
)


@dataclass
class RankedProfession:
    profession: object
    score: float
    match_percent: int
    rank: int
    shared_traits: list[str]


def empty_vector():
    return {key: 0.0 for key in TRAITS}


def add_weights(vector, weights, multiplier=1):
    for key in TRAITS:
        vector[key] += weights.get(key, 0) * multiplier


def normalize(vector):
    high = max(vector.values()) if vector else 0
    if high <= 0:
        return empty_vector()
    return {key: round(value / high, 4) for key, value in vector.items()}


def top_traits(vector, count):
    return [key for key, value in sorted(vector.items(), key=lambda item: item[1], reverse=True) if value > 0][:count]


def score_answers(options):
    vector = empty_vector()
    tag_scores = {}
    for option in options:
        intensity = max(0, min(option.value, 4)) / 4
        for tag in (option.scoring_payload or {}).get("tags", []):
            tag_scores[tag] = round(tag_scores.get(tag, 0) + intensity, 4)
            add_weights(vector, TAG_WEIGHTS.get(tag, {}), intensity)
    normalized = normalize(vector)
    return normalized, tag_scores, top_traits(normalized, 5)


def profession_vector(profession):
    vector = empty_vector()
    for tag in profession.scoring_tags:
        add_weights(vector, TAG_WEIGHTS.get(tag, {}), 1)
    add_weights(vector, CATEGORY_WEIGHTS.get(profession.category, {}), 0.65)
    return normalize(vector)


def cosine(first, second):
    dot = sum(first[key] * second[key] for key in TRAITS)
    first_len = sum(first[key] ** 2 for key in TRAITS)
    second_len = sum(second[key] ** 2 for key in TRAITS)
    if first_len == 0 or second_len == 0:
        return 0
    return dot / (sqrt(first_len) * sqrt(second_len))


def rank_professions(user_vector, tag_scores, professions):
    ranked = []
    for profession in professions:
        p_vector = profession_vector(profession)
        coverage_total = sum(min(user_vector[key], p_vector[key]) for key in TRAITS)
        expected = max(0.0001, sum(p_vector.values()))
        direct = sum(tag_scores.get(tag, 0) for tag in profession.scoring_tags)
        tag_score = min(1, direct / (max([1, *tag_scores.values()]) * max(2, len(profession.scoring_tags) * 0.5)))
        score = cosine(user_vector, p_vector) * 0.68 + (coverage_total / expected) * 0.22 + tag_score * 0.1
        shared_vector = {key: min(user_vector[key], p_vector[key]) for key in TRAITS}
        ranked.append(RankedProfession(profession, round(score, 5), 0, 0, top_traits(shared_vector, 3)))

    ranked.sort(key=lambda item: (-item.score, item.profession.slug))
    scores = [item.score for item in ranked] or [0]
    low, high = min(scores), max(scores)
    spread = max(0.0001, high - low)
    for index, item in enumerate(ranked):
        relative = (item.score - low) / spread
        item.rank = index + 1
        item.match_percent = round(min(97, max(52, 56 + item.score * 28 + relative * 12 + max(0, 4 - index) * 0.9)))
    return ranked


def labels(keys):
    return [TRAIT_LABELS[key] for key in keys[:3]]


def trait_text(keys, language):
    return ", ".join(TRAIT_LABELS[key][language].lower() for key in keys)


def recommendation_reason(item):
    return {
        "ru": f"Совпадение связано с выраженными признаками: {trait_text(item.shared_traits, 'ru')}.",
        "en": f"The match is connected to stronger signals in {trait_text(item.shared_traits, 'en')}.",
    }


def build_result(options, professions):
    user_vector, tag_scores, dominant = score_answers(options)
    ranked = rank_professions(user_vector, tag_scores, professions)
    selected = ranked[:4]
    primary = selected[0]
    strengths = labels(dominant)
    top_ru = trait_text(dominant[:3], "ru")
    top_en = trait_text(dominant[:3], "en")

    return {
        "userTraits": user_vector,
        "tagScores": tag_scores,
        "dominantTraits": dominant,
        "primary": primary,
        "alternatives": selected[1:4],
        "recommendations": selected,
        "summaryRu": f"Лучшее совпадение - {primary.profession.title_ru}. Расчет опирается на ответы, где сильнее всего проявились: {top_ru}.",
        "summaryEn": f"The strongest match is {primary.profession.title_en}. The calculation is based on answers where these signals were strongest: {top_en}.",
        "strengths": strengths,
        "workStyle": {"key": "results.workStyle", "ru": "Вам может подходить работа с понятными шагами, видимым прогрессом и пространством для инициативы.", "en": "You may fit work with clear steps, visible progress, and room for initiative."},
        "preferredEnvironment": {"key": "results.environment", "ru": "Комфортной может быть среда, где сочетаются ясность, поддержка и возможность пробовать разные подходы.", "en": "An environment that combines clarity, support, and room to try different approaches may feel comfortable."},
        "recommendedDirections": [
            {"key": "results.directions.digitalProducts", "ru": "Цифровые продукты и технологии", "en": "Digital products and technology"},
            {"key": "results.directions.humanResearch", "ru": "Исследования, данные и доказательная работа", "en": "Research, data, and evidence-based work"},
            {"key": "results.directions.learningDesign", "ru": "Обучение, коммуникация и помощь людям", "en": "Learning, communication, and helping people"},
        ],
        "roadmap": [
            {"id": "roadmap-1", "titleKey": "results.roadmap.step1.title", "descriptionKey": "results.roadmap.step1.description", "status": "next"},
            {"id": "roadmap-2", "titleKey": "results.roadmap.step2.title", "descriptionKey": "results.roadmap.step2.description", "status": "later"},
            {"id": "roadmap-3", "titleKey": "results.roadmap.step3.title", "descriptionKey": "results.roadmap.step3.description", "status": "later"},
        ],
    }
