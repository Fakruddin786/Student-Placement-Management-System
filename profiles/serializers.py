from rest_framework import serializers

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


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'username', 'phone', 'department', 'branch', 'cgpa', 'backlogs', 'resume', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'profile', 'name']
        read_only_fields = ['id', 'profile']

    def create(self, validated_data):
        profile, _ = StudentProfile.objects.get_or_create(user=self.context['request'].user)
        validated_data['profile'] = profile
        return super().create(validated_data)


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'profile', 'name', 'issuer', 'year']
        read_only_fields = ['id', 'profile']

    def create(self, validated_data):
        profile, _ = StudentProfile.objects.get_or_create(user=self.context['request'].user)
        validated_data['profile'] = profile
        return super().create(validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'profile', 'title', 'description', 'technologies']
        read_only_fields = ['id', 'profile']

    def create(self, validated_data):
        profile, _ = StudentProfile.objects.get_or_create(user=self.context['request'].user)
        validated_data['profile'] = profile
        return super().create(validated_data)


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = ['id', 'profile', 'company', 'role', 'duration', 'description']
        read_only_fields = ['id', 'profile']

    def create(self, validated_data):
        profile, _ = StudentProfile.objects.get_or_create(user=self.context['request'].user)
        validated_data['profile'] = profile
        return super().create(validated_data)


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = ['id', 'user', 'company_name', 'industry', 'website', 'contact_email', 'description', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class JobPostingSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)

    class Meta:
        model = JobPosting
        fields = [
            'id',
            'company',
            'company_name',
            'title',
            'description',
            'eligible_departments',
            'min_cgpa',
            'max_backlogs',
            'package_lpa',
            'location',
            'deadline',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'company', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.user.username', read_only=True)
    student_department = serializers.CharField(source='student.department', read_only=True)
    student_cgpa = serializers.DecimalField(source='student.cgpa', max_digits=4, decimal_places=2, read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.company_name', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'student',
            'student_username',
            'student_department',
            'student_cgpa',
            'job',
            'job_title',
            'company_name',
            'applied_at',
            'status',
            'interview_date',
            'interview_notes',
            'updated_at',
        ]
        read_only_fields = ['id', 'student', 'applied_at', 'updated_at']


class PlacementNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementNotification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

