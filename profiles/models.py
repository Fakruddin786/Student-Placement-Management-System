from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='')
    branch = models.CharField(max_length=100, blank=True, default='')
    cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default='0.00',
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('10.00'))],
    )
    backlogs = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(backlogs__gte=0), name='studentprofile_backlogs_non_negative'),
            models.CheckConstraint(condition=models.Q(cgpa__gte=0), name='studentprofile_cgpa_minimum'),
            models.CheckConstraint(condition=models.Q(cgpa__lte=10), name='studentprofile_cgpa_maximum'),
        ]

    def __str__(self):
        return f"{self.user.username}'s profile"


class Skill(models.Model):
    profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Certification(models.Model):
    profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=150)
    issuer = models.CharField(max_length=150)
    year = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} ({self.year})"


class Project(models.Model):
    profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    technologies = models.CharField(max_length=200)

    def __str__(self):
        return self.title


class Internship(models.Model):
    profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='internships')
    company = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    duration = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return f"{self.company} - {self.role}"
