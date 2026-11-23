from django import template

register = template.Library()


@register.filter
def paragraphs(text):
    """Split text on blank lines into a list of paragraphs."""
    return [p.strip() for p in (text or "").replace("\r\n", "\n").split("\n\n") if p.strip()]


@register.filter
def zero_pad(value, width=2):
    try:
        return str(int(value)).zfill(int(width))
    except (TypeError, ValueError):
        return value


@register.filter
def minus(value, arg):
    try:
        return int(value) - int(arg)
    except (TypeError, ValueError):
        return value
