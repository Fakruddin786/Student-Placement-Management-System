from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from profiles.models import StudentProfile


class Company(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='placement_company',
    )
    name = models.CharField(max_length=200)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    industry = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Job(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full time'
        PART_TIME = 'part_time', 'Part time'
        INTERNSHIP = 'internship', 'Internship'
        CONTRACT = 'contract', 'Contract'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200)
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices)
    min_cgpa = models.DecimalField(max_digits=4, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    max_backlogs = models.PositiveIntegerField(default=0)
    application_deadline = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(condition=models.Q(min_cgpa__lte=10), name='placement_job_cgpa_max_10'),
        ]

    def __str__(self):
        return f'{self.title} - {self.company.name}'

    def clean(self):
        super().clean()
        if self.min_cgpa is not None and self.min_cgpa > 10:
            raise ValidationError({'min_cgpa': 'Minimum CGPA cannot exceed 10.'})
        if self.is_active and self.application_deadline and self.application_deadline < timezone.localdate():
            raise ValidationError({'application_deadline': 'An active job must have a current or future application deadline.'})


class PlacementDrive(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='placement_drives')
    jobs = models.ManyToManyField(Job, blank=True, related_name='placement_drives')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    starts_on = models.DateField()
    ends_on = models.DateField()
    registration_deadline = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['starts_on', 'title']
        constraints = [
            models.CheckConstraint(condition=models.Q(ends_on__gte=models.F('starts_on')), name='placement_drive_end_after_start'),
            models.CheckConstraint(condition=models.Q(registration_deadline__lte=models.F('starts_on')), name='placement_drive_deadline_before_start'),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        errors = {}
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            errors['ends_on'] = 'Drive end date must be on or after its start date.'
        if self.starts_on and self.registration_deadline and self.registration_deadline > self.starts_on:
            errors['registration_deadline'] = 'Registration deadline must be on or before the drive start date.'
        if errors:
            raise ValidationError(errors)


class Application(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'submitted', 'Submitted'
        UNDER_REVIEW = 'under_review', 'Under review'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        REJECTED = 'rejected', 'Rejected'
        WITHDRAWN = 'withdrawn', 'Withdrawn'

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='placement_applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    drive = models.ForeignKey(
        PlacementDrive,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    cover_letter = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        constraints = [
            models.UniqueConstraint(fields=['student', 'job'], name='unique_student_job_application'),
        ]

    def __str__(self):
        return f'{self.student_id} - {self.job.title}'

    def clean(self):
        super().clean()
        if self.drive_id and self.job_id:
            if self.drive.company_id != self.job.company_id or not self.drive.jobs.filter(pk=self.job_id).exists():
                raise ValidationError({'drive': 'The selected drive must include this job and belong to its company.'})
        errors = {}
        if not self.pk and self.job_id and self.job.application_deadline < timezone.localdate():
            errors['job'] = 'Applications are closed for this job.'
        if not self.pk and self.student_id and self.job_id:
            if self.student.cgpa < self.job.min_cgpa:
                errors['student'] = "The student does not meet this job's minimum CGPA."
            if self.student.backlogs > self.job.max_backlogs:
                errors['student'] = "The student exceeds this job's maximum backlog count."
        if not self.pk and self.drive_id and self.drive.registration_deadline < timezone.localdate():
            errors['drive'] = 'Registration has closed for this placement drive.'
        if errors:
            raise ValidationError(errors)


class Interview(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class Mode(models.TextChoices):
        IN_PERSON = 'in_person', 'In person'
        ONLINE = 'online', 'Online'
        PHONE = 'phone', 'Phone'

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    scheduled_at = models.DateTimeField()
    mode = models.CharField(max_length=20, choices=Mode.choices)
    location = models.CharField(max_length=250, blank=True)
    meeting_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_placement_interviews',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f'Interview for application {self.application_id}'

    def clean(self):
        super().clean()
        errors = {}
        if self.scheduled_at and self.scheduled_at < timezone.now():
            previous_scheduled_at = None
            if self.pk:
                previous_scheduled_at = Interview.objects.filter(pk=self.pk).values_list('scheduled_at', flat=True).first()
            if previous_scheduled_at is None or previous_scheduled_at != self.scheduled_at:
                errors['scheduled_at'] = 'Interview must be scheduled in the future.'
        if self.mode == self.Mode.ONLINE and not self.meeting_url:
            errors['meeting_url'] = 'A meeting URL is required for online interviews.'
        if self.mode == self.Mode.IN_PERSON and not self.location:
            errors['location'] = 'A location is required for in-person interviews.'
        if errors:
            raise ValidationError(errors)


class Result(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SELECTED = 'selected', 'Selected'
        WAITLISTED = 'waitlisted', 'Waitlisted'
        REJECTED = 'rejected', 'Rejected'

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='result')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    offered_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    comments = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.application} - {self.get_status_display()}'


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placement_notifications',
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} for user {self.recipient_id}'


class Resume(models.Model):
    profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='uploaded_resumes')
    title = models.CharField(max_length=150)
    file = models.FileField(
        upload_to='placement_resumes/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])],
    )
    is_default = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']
        constraints = [
            models.UniqueConstraint(
                fields=['profile'],
                condition=models.Q(is_default=True),
                name='unique_default_placement_resume_per_student',
            ),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        if self.file and self.file.size > 5 * 1024 * 1024:
            raise ValidationError({'file': 'Resume file size must be 5 MB or less.'})
        if self.is_default and self.profile_id:
            duplicates = Resume.objects.filter(profile_id=self.profile_id, is_default=True)
            if self.pk:
                duplicates = duplicates.exclude(pk=self.pk)
            if duplicates.exists():
                raise ValidationError({'is_default': 'A student can have only one default placement resume.'})
