from rest_framework import serializers

from .models import Certification, Internship, Project, Skill, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'phone', 'department', 'branch', 'cgpa', 'backlogs', 'resume', 'created_at', 'updated_at']
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
