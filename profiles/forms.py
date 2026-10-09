import os
from decimal import Decimal

from django import forms
from django.core.exceptions import ValidationError

from .models import (
    Application,
    Certification,
    CompanyProfile,
    Internship,
    JobPosting,
    PlacementNotification,
    Project,
    Skill,
    StudentProfile,
)

ALLOWED_RESUME_EXTENSIONS = {'.pdf', '.doc', '.docx'}
MAX_RESUME_SIZE = 5 * 1024 * 1024


class StudentProfileForm(forms.ModelForm):
    backlogs = forms.IntegerField(
        min_value=0,
        required=True,
        error_messages={'required': 'Backlogs is required.', 'min_value': 'Backlogs cannot be negative.'}
    )

    class Meta:
        model = StudentProfile
        fields = ['phone', 'department', 'branch', 'cgpa', 'backlogs', 'resume']

    def clean(self):
        cleaned_data = super().clean()
        for field_name in ['phone', 'department', 'branch', 'cgpa']:
            value = cleaned_data.get(field_name)
            if value is None or (isinstance(value, str) and not value.strip()):
                self.add_error(field_name, 'This field is required.')
        return cleaned_data

    def clean_phone(self):
        phone = self.cleaned_data.get('phone', '')
        if phone is None:
            raise ValidationError('Phone is required.')
        phone = str(phone).strip()
        if not phone:
            raise ValidationError('Phone is required.')
        if not phone.isdigit():
            raise ValidationError('Phone number must contain only digits.')
        if len(phone) != 10:
            raise ValidationError('Phone number must be exactly 10 digits.')
        return phone

    def clean_cgpa(self):
        cgpa = self.cleaned_data.get('cgpa')
        if cgpa is None:
            raise ValidationError('CGPA is required.')
        if cgpa < Decimal('0') or cgpa > Decimal('10'):
            raise ValidationError('CGPA must be between 0 and 10.')
        return cgpa

    def clean_backlogs(self):
        backlogs = self.cleaned_data.get('backlogs')
        if backlogs is None:
            raise ValidationError('Backlogs is required.')
        if backlogs < 0:
            raise ValidationError('Backlogs cannot be negative.')
        return backlogs

    def clean_resume(self):
        resume = self.cleaned_data.get('resume')
        if not resume:
            return resume

        ext = os.path.splitext(resume.name)[1].lower()
        if ext not in ALLOWED_RESUME_EXTENSIONS:
            raise ValidationError('Unsupported file type.')

        if resume.size > MAX_RESUME_SIZE:
            raise ValidationError('Resume file size must be 5 MB or less.')

        return resume


class SkillForm(forms.ModelForm):
    class Meta:
        model = Skill
        fields = ['name']

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if name is None:
            raise ValidationError('Skill name is required.')
        name = str(name).strip()
        if not name:
            raise ValidationError('Skill name is required.')
        return name


class CertificationForm(forms.ModelForm):
    class Meta:
        model = Certification
        fields = ['name', 'issuer', 'year']

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if name is None:
            raise ValidationError('Certification name is required.')
        name = str(name).strip()
        if not name:
            raise ValidationError('Certification name is required.')
        return name

    def clean_issuer(self):
        issuer = self.cleaned_data.get('issuer')
        if issuer is None:
            raise ValidationError('Issuer is required.')
        issuer = str(issuer).strip()
        if not issuer:
            raise ValidationError('Issuer is required.')
        return issuer

    def clean_year(self):
        year = self.cleaned_data.get('year')
        if year in (None, ''):
            raise ValidationError('Certification year is required.')
        if year < 1000 or year > 9999:
            raise ValidationError('Certification year must be a valid 4-digit year.')
        return year


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['title', 'description', 'technologies']

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if title is None:
            raise ValidationError('Project title is required.')
        title = str(title).strip()
        if not title:
            raise ValidationError('Project title is required.')
        return title

    def clean_description(self):
        description = self.cleaned_data.get('description')
        if description is None:
            raise ValidationError('Project description is required.')
        description = str(description).strip()
        if not description:
            raise ValidationError('Project description is required.')
        return description

    def clean_technologies(self):
        technologies = self.cleaned_data.get('technologies')
        if technologies is None:
            raise ValidationError('Project technologies is required.')
        technologies = str(technologies).strip()
        if not technologies:
            raise ValidationError('Project technologies is required.')
        return technologies


class InternshipForm(forms.ModelForm):
    class Meta:
        model = Internship
        fields = ['company', 'role', 'duration', 'description']

    def clean_company(self):
        company = self.cleaned_data.get('company')
        if company is None:
            raise ValidationError('Company is required.')
        company = str(company).strip()
        if not company:
            raise ValidationError('Company is required.')
        return company

    def clean_role(self):
        role = self.cleaned_data.get('role')
        if role is None:
            raise ValidationError('Role is required.')
        role = str(role).strip()
        if not role:
            raise ValidationError('Role is required.')
        return role

    def clean_duration(self):
        duration = self.cleaned_data.get('duration')
        if duration is None:
            raise ValidationError('Duration is required.')
        duration = str(duration).strip()
        if not duration:
            raise ValidationError('Duration is required.')
        return duration

    def clean_description(self):
        description = self.cleaned_data.get('description')
        if description is None:
            raise ValidationError('Description is required.')
        description = str(description).strip()
        if not description:
            raise ValidationError('Description is required.')
        return description


class CompanyProfileForm(forms.ModelForm):
    class Meta:
        model = CompanyProfile
        fields = ['company_name', 'industry', 'website', 'contact_email', 'description']

    def clean_company_name(self):
        name = self.cleaned_data.get('company_name')
        if not name or not str(name).strip():
            raise ValidationError('Company name is required.')
        return str(name).strip()


class JobPostingForm(forms.ModelForm):
    deadline = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=False,
    )

    class Meta:
        model = JobPosting
        fields = [
            'title',
            'description',
            'eligible_departments',
            'min_cgpa',
            'max_backlogs',
            'package_lpa',
            'location',
            'deadline',
            'status',
        ]

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if not title or not str(title).strip():
            raise ValidationError('Job title is required.')
        return str(title).strip()

    def clean_min_cgpa(self):
        cgpa = self.cleaned_data.get('min_cgpa')
        if cgpa is not None and (cgpa < Decimal('0') or cgpa > Decimal('10')):
            raise ValidationError('Minimum CGPA must be between 0 and 10.')
        return cgpa


class ApplicationStatusForm(forms.ModelForm):
    interview_date = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        required=False,
    )

    class Meta:
        model = Application
        fields = ['status', 'interview_date', 'interview_notes']


class NotificationForm(forms.ModelForm):
    class Meta:
        model = PlacementNotification
        fields = ['title', 'message', 'notification_type']

