import re

from django import forms

from .models import ContactMessage


class ContactForm(forms.ModelForm):
    # Honeypot: real users never see or fill this field.
    website = forms.CharField(required=False, widget=forms.TextInput(attrs={"tabindex": "-1", "autocomplete": "off"}))

    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message"]
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Your name", "autocomplete": "name", "maxlength": 100}),
            "email": forms.EmailInput(attrs={"placeholder": "you@example.com", "autocomplete": "email"}),
            "subject": forms.TextInput(attrs={"placeholder": "Subject", "maxlength": 150}),
            "message": forms.Textarea(attrs={"placeholder": "Tell me about your project or opportunity…", "rows": 5}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            if name == "website":
                continue
            field.widget.attrs.setdefault("class", "form-control")
            field.widget.attrs["required"] = True

    def clean_name(self):
        name = " ".join(self.cleaned_data["name"].split())
        if len(name) < 2:
            raise forms.ValidationError("Please enter your full name.")
        if not re.match(r"^[\w\s.'-]+$", name, re.UNICODE):
            raise forms.ValidationError("Name contains invalid characters.")
        return name

    def clean_subject(self):
        subject = self.cleaned_data["subject"].strip()
        if len(subject) < 3:
            raise forms.ValidationError("Subject must be at least 3 characters.")
        return subject

    def clean_message(self):
        message = self.cleaned_data["message"].strip()
        if len(message) < 10:
            raise forms.ValidationError("Message must be at least 10 characters.")
        if len(message) > 5000:
            raise forms.ValidationError("Message is too long (max 5000 characters).")
        return message

    def full_clean(self):
        super().full_clean()
        for name in self.errors:
            if name in self.fields:
                css = self.fields[name].widget.attrs.get("class", "")
                self.fields[name].widget.attrs["class"] = f"{css} is-invalid".strip()

    @property
    def is_spam(self):
        return bool(self.cleaned_data.get("website"))
