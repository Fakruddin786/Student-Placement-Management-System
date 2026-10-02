from django.contrib import admin

from .models import Certification, Internship, Project, Skill, StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'branch', 'cgpa', 'backlogs')
    search_fields = ('user__username', 'department', 'branch')
    list_filter = ('department', 'branch')
    ordering = ('user__username',)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('profile', 'name')
    search_fields = ('name', 'profile__user__username')
    list_filter = ('profile__department',)


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ('profile', 'name', 'issuer', 'year')
    search_fields = ('name', 'issuer', 'profile__user__username')
    list_filter = ('year', 'issuer')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('profile', 'title', 'technologies')
    search_fields = ('title', 'technologies', 'profile__user__username')
    list_filter = ('technologies',)


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('profile', 'company', 'role', 'duration')
    search_fields = ('company', 'role', 'profile__user__username')
    list_filter = ('company', 'role')
