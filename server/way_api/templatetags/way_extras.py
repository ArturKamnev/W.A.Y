from django import template

from way_api.i18n import CATEGORIES, LANGUAGES, SKILLS, TAGS, label, profession_description, profession_title, translate

register = template.Library()


@register.filter
def get_item(value, key):
    if isinstance(value, dict):
        return value.get(key)
    return None


@register.filter
def percent_width(value):
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return 0


@register.simple_tag(takes_context=True)
def ui(context, key):
    return translate(key, context.get("current_language", "ru"))


@register.simple_tag
def language_name(code):
    return LANGUAGES.get(code, code.upper())


@register.filter
def category_label(value, language):
    return label(CATEGORIES, value, language)


@register.filter
def skill_label(value, language):
    return label(SKILLS, value, language)


@register.filter
def tag_label(value, language):
    return label(TAGS, value, language)


@register.filter
def localized_title(profession, language):
    return profession_title(profession, language)


@register.filter
def localized_description(profession, language):
    return profession_description(profession, language)


@register.filter
def localized_text(value, language):
    if not isinstance(value, dict):
        return value
    language = language if language in LANGUAGES else "ru"
    return value.get(language) or value.get("ru") or value.get("en") or ""


@register.filter
def option_label(option, language):
    if language == "en":
        return option.label_en
    return option.label_ru


@register.filter
def question_text(question, language):
    if language == "en":
        return question.text_en
    return question.text_ru
