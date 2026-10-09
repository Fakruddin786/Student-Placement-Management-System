from pathlib import Path

from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from profiles.models import StudentProfile

from .models import (
    Application,
    Company,
    Interview,
    Job,
    Notification,
    PlacementDrive,
    Result,
    Resume,
)

User = get_user_model()


class ModelValidationMixin:
    def validate_model(self, instance):
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages) from exc


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'date_joined', 'password',
        ]
        read_only_fields = ['id', 'date_joined']

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'A password is required when creating a user.'})
        password = attrs.get('password')
        if password:
            try:
                validate_password(password, self.instance)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'password': exc.messages}) from exc
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=['password'])
        return instance


class CompanySerializer(ModelValidationMixin, serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Company
        fields = ['id', 'owner', 'name', 'website', 'description', 'industry', 'location', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance or Company()
        for key, value in attrs.items():
            setattr(instance, key, value)
        if self.instance is None:
            instance.owner = self.context['request'].user
        self.validate_model(instance)
        return attrs


class JobSerializer(ModelValidationMixin, serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())

    class Meta:
        model = Job
        fields = [
            'id', 'company', 'title', 'description', 'location', 'employment_type',
            'min_cgpa', 'max_backlogs', 'application_deadline', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context['request']
        company = attrs.get('company', self.instance.company if self.instance else None)
        if company and not request.user.is_staff and company.owner_id != request.user.id:
            raise serializers.ValidationError({'company': 'You can only manage jobs for a company you own.'})
        instance = self.instance or Job()
        for key, value in attrs.items():
            setattr(instance, key, value)
        self.validate_model(instance)
        return attrs


class PlacementDriveSerializer(ModelValidationMixin, serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())
    jobs = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all(), many=True, required=False)

    class Meta:
        model = PlacementDrive
        fields = [
            'id', 'company', 'jobs', 'title', 'description', 'starts_on',
            'ends_on', 'registration_deadline', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context['request']
        company = attrs.get('company', self.instance.company if self.instance else None)
        jobs = attrs.get('jobs', list(self.instance.jobs.all()) if self.instance else [])
        if company and not request.user.is_staff and company.owner_id != request.user.id:
            raise serializers.ValidationError({'company': 'You can only manage drives for a company you own.'})
        mismatched_jobs = [job.pk for job in jobs if company and job.company_id != company.pk]
        if mismatched_jobs:
            raise serializers.ValidationError({'jobs': 'Every drive job must belong to the selected company.'})
        instance = self.instance or PlacementDrive()
        for key, value in attrs.items():
            if key != 'jobs':
                setattr(instance, key, value)
        self.validate_model(instance)
        return attrs


class ApplicationSerializer(ModelValidationMixin, serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.filter(is_active=True))
    drive = serializers.PrimaryKeyRelatedField(queryset=PlacementDrive.objects.filter(is_active=True), allow_null=True, required=False)

    class Meta:
        model = Application
        fields = ['id', 'student', 'job', 'drive', 'status', 'cover_letter', 'applied_at', 'updated_at']
        read_only_fields = ['id', 'student', 'applied_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and isinstance(self.instance, Application):
            if self.instance.student.user_id == request.user.id and not request.user.is_staff:
                self.fields['status'].read_only = True
                self.fields['job'].read_only = True
                self.fields['drive'].read_only = True
            elif not request.user.is_staff:
                self.fields['student'].read_only = True
                self.fields['job'].read_only = True
                self.fields['drive'].read_only = True
                self.fields['cover_letter'].read_only = True

    def validate(self, attrs):
        request = self.context['request']
        job = attrs.get('job', self.instance.job if self.instance else None)
        drive = attrs.get('drive', self.instance.drive if self.instance else None)
        if self.instance is None:
            profile = StudentProfile.objects.filter(user=request.user).first()
            if profile is None:
                raise serializers.ValidationError({'student': 'Create a student profile before applying.'})
            if job and Application.objects.filter(student=profile, job=job).exists():
                raise serializers.ValidationError({'job': 'You have already applied for this job.'})
        if drive and job and (drive.company_id != job.company_id or not drive.jobs.filter(pk=job.pk).exists()):
            raise serializers.ValidationError({'drive': 'The selected drive must include this job and belong to its company.'})
        if self.instance is None and job and job.application_deadline < timezone.localdate():
            raise serializers.ValidationError({'job': 'Applications are closed for this job.'})
        if self.instance is None and drive and drive.registration_deadline < timezone.localdate():
            raise serializers.ValidationError({'drive': 'Registration has closed for this placement drive.'})
        if job and self.instance is None:
            profile = StudentProfile.objects.filter(user=request.user).first()
            if profile and profile.cgpa < job.min_cgpa:
                raise serializers.ValidationError({'student': "You do not meet this job's minimum CGPA."})
            if profile and profile.backlogs > job.max_backlogs:
                raise serializers.ValidationError({'student': "You exceed this job's maximum backlog count."})
        instance = self.instance or Application()
        if self.instance is None:
            instance.student = profile
        for key, value in attrs.items():
            setattr(instance, key, value)
        self.validate_model(instance)
        return attrs


class InterviewSerializer(ModelValidationMixin, serializers.ModelSerializer):
    application = serializers.PrimaryKeyRelatedField(queryset=Application.objects.all())
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'scheduled_at', 'mode', 'location',
            'meeting_url', 'status', 'notes', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance or Interview()
        for key, value in attrs.items():
            setattr(instance, key, value)
        self.validate_model(instance)
        return attrs


class ResultSerializer(ModelValidationMixin, serializers.ModelSerializer):
    application = serializers.PrimaryKeyRelatedField(queryset=Application.objects.all())

    class Meta:
        model = Result
        fields = [
            'id', 'application', 'status', 'offered_salary',
            'comments', 'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance or Result()
        for key, value in attrs.items():
            setattr(instance, key, value)
        self.validate_model(instance)
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.PrimaryKeyRelatedField(read_only=True)
    application = serializers.PrimaryKeyRelatedField(queryset=Application.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'application', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'recipient', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and not request.user.is_staff:
            if self.instance:
                self.fields['application'].read_only = True
                self.fields['title'].read_only = True
                self.fields['message'].read_only = True
            else:
                self.fields['is_read'].read_only = True

    def validate_application(self, application):
        request = self.context['request']
        if request.user.is_staff:
            return application
        if (
            application.student.user_id != request.user.id
            and application.job.company.owner_id != request.user.id
        ):
            raise serializers.ValidationError('You can only link notifications to an application you are involved with.')
        return application


class ResumeSerializer(ModelValidationMixin, serializers.ModelSerializer):
    profile = serializers.PrimaryKeyRelatedField(read_only=True)
    file = serializers.FileField()

    class Meta:
        model = Resume
        fields = ['id', 'profile', 'title', 'file', 'is_default', 'uploaded_at', 'updated_at']
        read_only_fields = ['id', 'profile', 'uploaded_at', 'updated_at']

    def validate_file(self, value):
        if Path(value.name).suffix.lower() not in {'.pdf', '.doc', '.docx'}:
            raise serializers.ValidationError('Only PDF, DOC, and DOCX resumes are allowed.')
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Resume file size must be 5 MB or less.')
        return value

    def validate(self, attrs):
        request = self.context['request']
        profile = self.instance.profile if self.instance else StudentProfile.objects.filter(user=request.user).first()
        if profile is None:
            raise serializers.ValidationError({'profile': 'Create a student profile before uploading a resume.'})
        instance = self.instance or Resume(profile=profile)
        for key, value in attrs.items():
            setattr(instance, key, value)
        self.validate_model(instance)
        return attrs
