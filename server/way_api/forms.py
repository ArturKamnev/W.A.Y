from django import forms
from django.contrib.auth import authenticate

from way_api.models import User


class LoginForm(forms.Form):
    identifier = forms.CharField(label="Email", max_length=254)
    password = forms.CharField(label="Пароль", widget=forms.PasswordInput)

    def clean(self):
        data = super().clean()
        identifier = (data.get("identifier") or "").strip().lower()
        password = data.get("password") or ""
        user = authenticate(username=identifier, password=password)
        if not user:
            raise forms.ValidationError("Неверный email или пароль.")
        if not user.is_active:
            raise forms.ValidationError("Аккаунт отключен.")
        data["user"] = user
        return data


class SignupForm(forms.Form):
    name = forms.CharField(label="Имя", min_length=2, max_length=80)
    email = forms.EmailField(label="Email")
    password = forms.CharField(label="Пароль", min_length=8, widget=forms.PasswordInput)
    grade = forms.CharField(label="Класс или возраст", max_length=40, required=False)

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Пользователь с таким email уже существует.")
        return email

    def save(self):
        return User.objects.create_user(
            email=self.cleaned_data["email"],
            password=self.cleaned_data["password"],
            name=self.cleaned_data["name"],
            grade_or_age=self.cleaned_data.get("grade", ""),
            preferred_language="ru",
        )


class ProfileForm(forms.ModelForm):
    grade = forms.CharField(label="Класс или возраст", max_length=40, required=False)

    class Meta:
        model = User
        fields = ["name", "preferred_language"]
        labels = {"name": "Имя", "preferred_language": "Язык"}
        widgets = {"preferred_language": forms.Select(choices=(("ru", "Русский"), ("en", "English")))}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance:
            self.fields["grade"].initial = self.instance.grade_or_age

    def save(self, commit=True):
        user = super().save(commit=False)
        user.grade_or_age = self.cleaned_data.get("grade", "")
        if commit:
            user.save()
        return user
