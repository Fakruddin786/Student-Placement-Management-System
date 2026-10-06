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


class CompanyProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100, blank=True, default='')
    website = models.URLField(blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name or f"{self.user.username} (Company)"


class PlacementOfficerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='officer_profile')
    department = models.CharField(max_length=100, blank=True, default='')
    designation = models.CharField(max_length=100, blank=True, default='Placement Officer')
    phone = models.CharField(max_length=15, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.designation})"


class JobPosting(models.Model):
    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('Closed', 'Closed'),
    )

    company = models.ForeignKey(CompanyProfile, on_delete=models.CASCADE, related_name='job_postings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    eligible_departments = models.CharField(max_length=200, default='All', help_text="Comma separated departments or 'All'")
    min_cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('10.00'))],
    )
    max_backlogs = models.PositiveIntegerField(default=0)
    package_lpa = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'), help_text="Package in LPA")
    location = models.CharField(max_length=150, blank=True, default='')
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.company.company_name}"


class Application(models.Model):
    STATUS_CHOICES = (
        ('Applied', 'Applied'),
        ('Shortlisted', 'Shortlisted'),
        ('Interview Scheduled', 'Interview Scheduled'),
        ('Placed', 'Placed'),
        ('Rejected', 'Rejected'),
    )

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Applied')
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'job'], name='unique_student_job_application')
        ]

    def __str__(self):
        return f"{self.student.user.username} -> {self.job.title} ({self.status})"


class PlacementNotification(models.Model):
    TYPE_CHOICES = (
        ('Application', 'Application'),
        ('Interview', 'Interview'),
        ('Placement', 'Placement'),
        ('General', 'General'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='placement_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='General')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

