from django import forms
from django.contrib.auth.forms import UserCreationForm

from .models import User


class RegistrationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].help_text = 'Use an email address you can use to log in later.'
        self.fields['password1'].help_text = 'Use at least 8 characters. Avoid common or entirely numeric passwords.'
        self.fields['role'].choices = [
            choice for choice in User.Role.choices if choice[0] != User.Role.ADMIN
        ]

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(
                'An account with this email already exists. Use the login page instead.'
            )
        return email


class LoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput)


class UserManagementForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'role', 'is_active', 'is_staff')