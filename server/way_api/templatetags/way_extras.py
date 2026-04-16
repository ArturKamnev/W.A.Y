from django import template

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
