from django.contrib import admin

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


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'industry', 'location', 'created_at')
    search_fields = ('name', 'owner__username', 'industry', 'location')
    list_filter = ('industry',)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'employment_type', 'application_deadline', 'is_active')
    search_fields = ('title', 'company__name', 'location')
    list_filter = ('employment_type', 'is_active', 'location')


@admin.register(PlacementDrive)
class PlacementDriveAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'starts_on', 'ends_on', 'registration_deadline', 'is_active')
    search_fields = ('title', 'company__name')
    list_filter = ('is_active', 'starts_on')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('student', 'job', 'status', 'applied_at')
    search_fields = ('student__user__username', 'job__title', 'job__company__name')
    list_filter = ('status', 'applied_at')


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('application', 'scheduled_at', 'mode', 'status')
    list_filter = ('mode', 'status', 'scheduled_at')


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('application', 'status', 'offered_salary', 'published_at')
    list_filter = ('status', 'published_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'is_read', 'created_at')
    search_fields = ('title', 'recipient__username')
    list_filter = ('is_read', 'created_at')


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'is_default', 'uploaded_at')
    search_fields = ('title', 'profile__user__username')
    list_filter = ('is_default', 'uploaded_at')
